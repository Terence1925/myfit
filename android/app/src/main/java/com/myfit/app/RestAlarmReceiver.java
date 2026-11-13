package com.myfit.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;
import android.service.notification.StatusBarNotification;

import androidx.core.app.NotificationCompat;

/**
 * Fires when a rest ends. Posts a high-priority notification flagged INSISTENT, which makes Android
 * repeat the ring and the vibration until the notification is dismissed ("Got it", tapping it, or
 * swiping it away). Also handles the "Got it" button itself.
 */
public class RestAlarmReceiver extends BroadcastReceiver {

    private static final String TAG = "RestAlarm";
    static final String EXTRA_TITLE = "title";
    static final String EXTRA_BODY = "body";
    static final String EXTRA_SOUND = "sound";
    static final String ACTION_DISMISS = "com.myfit.app.REST_DISMISS";

    // Channel settings (sound, vibration) can't be changed after a channel exists, so each alarm sound gets its
    // own channel (one per choice in the app). Older ids are removed in ensureChannel().
    private static final String CHANNEL_PREFIX = "rest-timer-alarm-v3-";
    private static final String[] OLD_CHANNEL_IDS = new String[] { "rest-timer-alarm", "rest-timer", "rest-timer-alarm-v2" };
    static final String DEFAULT_SOUND = "chime";
    private static final String[] SOUNDS = new String[] { "chime", "beeps", "digital" };
    private static final String[] SOUND_NAMES = new String[] { "Chime", "Beeps", "Digital alarm" };
    private static final int NOTIFICATION_ID = 4102;
    private static final long[] VIBRATION_PATTERN = new long[] { 0, 700, 400, 700, 400 };

    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            handle(context, intent);
        } catch (Throwable t) {
            Log.e(TAG, "onReceive failed", t);
        }
    }

    private void handle(Context context, Intent intent) {
        Log.d(TAG, "receiver triggered, action=" + intent.getAction());
        if (ACTION_DISMISS.equals(intent.getAction())) {
            cancelNotification(context);
            return;
        }

        String title = intent.getStringExtra(EXTRA_TITLE);
        String body = intent.getStringExtra(EXTRA_BODY);
        if (title == null) title = "Rest over";
        if (body == null) body = "";
        String sound = cleanSound(intent.getStringExtra(EXTRA_SOUND));

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;
        ensureChannel(manager, context, sound);

        Intent open = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        PendingIntent openPending = PendingIntent.getActivity(
            context,
            2,
            open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent dismiss = new Intent(context, RestAlarmReceiver.class).setAction(ACTION_DISMISS);
        PendingIntent dismissPending = PendingIntent.getBroadcast(
            context,
            3,
            dismiss,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId(sound))
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setVibrate(VIBRATION_PATTERN)
            .setAutoCancel(true)
            .setContentIntent(openPending)
            .setDeleteIntent(dismissPending)
            .addAction(0, "Got it", dismissPending);

        // Android 7 to 7.1 have no channels, so the sound is set on the notification itself.
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            builder.setSound(soundUri(context, sound), AudioManager.STREAM_ALARM);
        }

        Notification notification = builder.build();
        // Repeat the ring and the vibration until the notification is cancelled.
        notification.flags |= Notification.FLAG_INSISTENT;
        manager.notify(NOTIFICATION_ID, notification);
        Log.d(TAG, "alarm fired, notification posted (notifications enabled: " + manager.areNotificationsEnabled() + ")");
    }

    static void cancelNotification(Context context) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) manager.cancel(NOTIFICATION_ID);
    }

    /** True while the rest-over notification is still showing (so still ringing and vibrating). */
    static boolean isNotificationActive(Context context) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return false;
        for (StatusBarNotification active : manager.getActiveNotifications()) {
            if (active.getId() == NOTIFICATION_ID) return true;
        }
        return false;
    }

    /** Only the sounds the app offers; anything else (or nothing) is the default. */
    static String cleanSound(String sound) {
        if (sound != null) {
            for (String known : SOUNDS) {
                if (known.equals(sound)) return sound;
            }
        }
        return DEFAULT_SOUND;
    }

    static String channelId(String sound) {
        return CHANNEL_PREFIX + sound;
    }

    /** The bundled sound file (res/raw/rest_<name>.wav). */
    private static Uri soundUri(Context context, String sound) {
        int id = context.getResources().getIdentifier("rest_" + sound, "raw", context.getPackageName());
        if (id != 0) return Uri.parse("android.resource://" + context.getPackageName() + "/" + id);
        Uri fallback = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        if (fallback == null) fallback = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        return fallback;
    }

    static void ensureChannel(NotificationManager manager, Context context, String sound) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        for (String oldId : OLD_CHANNEL_IDS) {
            manager.deleteNotificationChannel(oldId);
        }
        String name = "Rest timer alarm";
        for (int i = 0; i < SOUNDS.length; i++) {
            if (SOUNDS[i].equals(sound)) name = "Rest timer alarm (" + SOUND_NAMES[i] + ")";
        }
        NotificationChannel channel = new NotificationChannel(channelId(sound), name, NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("Rings and vibrates when your rest is over, until you tap Got it");
        channel.enableVibration(true);
        channel.setVibrationPattern(VIBRATION_PATTERN);
        // Plays on the alarm volume, so it is heard even when the ringer is on silent or vibrate.
        AudioAttributes attributes = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build();
        channel.setSound(soundUri(context, sound), attributes);
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        manager.createNotificationChannel(channel);
    }
}
