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
    static final String ACTION_DISMISS = "com.myfit.app.REST_DISMISS";

    // Channel settings (sound, vibration) can't be changed after a channel exists, so a new sound means
    // a new channel id. Older ids are removed in ensureChannel().
    static final String CHANNEL_ID = "rest-timer-alarm-v2";
    private static final String[] OLD_CHANNEL_IDS = new String[] { "rest-timer-alarm", "rest-timer" };
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

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;
        ensureChannel(manager);

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

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
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
            builder.setSound(alarmSound(), AudioManager.STREAM_ALARM);
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

    private static Uri alarmSound() {
        Uri sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        if (sound == null) sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        return sound;
    }

    static void ensureChannel(NotificationManager manager) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        for (String oldId : OLD_CHANNEL_IDS) {
            manager.deleteNotificationChannel(oldId);
        }
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "Rest timer alarm",
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Rings and vibrates when your rest is over, until you tap Got it");
        channel.enableVibration(true);
        channel.setVibrationPattern(VIBRATION_PATTERN);
        // Plays on the alarm volume, so it is heard even when the ringer is on silent or vibrate.
        AudioAttributes attributes = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build();
        channel.setSound(alarmSound(), attributes);
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        manager.createNotificationChannel(channel);
    }
}
