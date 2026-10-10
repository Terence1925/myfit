package com.myfit.app;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.os.Vibrator;
import android.provider.Settings;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Rest-timer alarm. Schedules an alarm for the end of the rest that fires on time even when the app
 * is in the background or the phone is idle, then keeps the phone vibrating until the user taps
 * "Got it" (see RestAlarmReceiver).
 *
 * Uses AlarmManager.setAlarmClock, which is exact and needs no special permission (unlike
 * SCHEDULE_EXACT_ALARM, which Google Play restricts). The system shows a small alarm icon in the
 * status bar while a rest is running.
 *
 * Every method catches Throwable and reports it back to the app (and to Logcat with a full stack
 * trace) instead of letting it take the whole app down.
 */
@CapacitorPlugin(name = "RestAlarm")
public class RestAlarmPlugin extends Plugin {

    private static final String TAG = "RestAlarm";
    private static final int REQUEST_TRIGGER = 0;
    private static final int REQUEST_SHOW_APP = 1;

    @Override
    public void load() {
        Log.d(TAG, "plugin loaded");
    }

    /** Whether Android currently lets this app set exact alarms (always true below Android 12). */
    private static boolean canScheduleExact(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true;
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        return alarmManager != null && alarmManager.canScheduleExactAlarms();
    }

    @PluginMethod
    public void canExact(PluginCall call) {
        try {
            JSObject result = new JSObject();
            result.put("allowed", canScheduleExact(getContext()));
            call.resolve(result);
        } catch (Throwable t) {
            fail(call, "canExact", t);
        }
    }

    /** Opens Android's "Alarms & reminders" screen for this app, where the person can switch exact alarms on. */
    @PluginMethod
    public void openExactSettings(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                Context context = getContext();
                Intent intent = new Intent(
                    Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                    Uri.parse("package:" + context.getPackageName())
                );
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            }
            call.resolve();
        } catch (Throwable t) {
            fail(call, "openExactSettings", t);
        }
    }

    private void fail(PluginCall call, String what, Throwable t) {
        Log.e(TAG, what + " failed", t);
        call.reject(what + " failed: " + t);
    }

    @PluginMethod
    public void start(PluginCall call) {
        try {
            Log.d(TAG, "start() called");
            // A millisecond timestamp is a large whole number, which Capacitor's getDouble() does not accept
            // (it only handles Double, Float and Integer), so read it as a long from the raw data.
            long endsAt = call.getData().optLong("endsAt", 0L);
            if (endsAt <= 0L) {
                Log.w(TAG, "start() called without a valid endsAt");
                call.reject("endsAt is required");
                return;
            }
            String title = call.getString("title", "Rest over");
            String body = call.getString("body", "");

            Context context = getContext();
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) {
                call.reject("AlarmManager not available");
                return;
            }
            if (!canScheduleExact(context)) {
                call.reject("EXACT_ALARM_NOT_ALLOWED");
                return;
            }

            // Clear anything left over from an earlier rest.
            RestAlarmReceiver.cancelNotification(context);

            Intent triggerIntent = new Intent(context, RestAlarmReceiver.class);
            triggerIntent.putExtra(RestAlarmReceiver.EXTRA_TITLE, title);
            triggerIntent.putExtra(RestAlarmReceiver.EXTRA_BODY, body);
            PendingIntent trigger = PendingIntent.getBroadcast(
                context,
                REQUEST_TRIGGER,
                triggerIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            Intent openApp = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
            if (openApp == null) {
                call.reject("Could not find the app's launch screen");
                return;
            }
            PendingIntent show = PendingIntent.getActivity(
                context,
                REQUEST_SHOW_APP,
                openApp,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            alarmManager.setAlarmClock(new AlarmManager.AlarmClockInfo(endsAt, show), trigger);
            Log.d(TAG, "alarm set for " + (endsAt - System.currentTimeMillis()) / 1000 + " seconds from now");
            call.resolve();
        } catch (Throwable t) {
            fail(call, "start", t);
        }
    }

    /** Reports the phone settings that decide whether the alert can ring and vibrate. */
    @PluginMethod
    public void diagnose(PluginCall call) {
        try {
            Log.d(TAG, "diagnose() called");
            Context context = getContext();
            JSObject result = new JSObject();
            result.put("sdk", Build.VERSION.SDK_INT);

            NotificationManager notifications = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (notifications != null) {
                result.put("notificationsEnabled", notifications.areNotificationsEnabled());
                RestAlarmReceiver.ensureChannel(notifications);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    NotificationChannel channel = notifications.getNotificationChannel(RestAlarmReceiver.CHANNEL_ID);
                    if (channel != null) {
                        result.put("channelImportance", channel.getImportance());
                        result.put("channelVibrates", channel.shouldVibrate());
                        result.put("channelHasSound", channel.getSound() != null);
                    }
                }
                result.put("interruptionFilter", notifications.getCurrentInterruptionFilter());
            }

            AudioManager audio = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
            if (audio != null) {
                result.put("ringerMode", audio.getRingerMode());
                result.put("alarmVolume", audio.getStreamVolume(AudioManager.STREAM_ALARM));
                result.put("alarmVolumeMax", audio.getStreamMaxVolume(AudioManager.STREAM_ALARM));
            }

            Vibrator vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            result.put("hasVibrator", vibrator != null && vibrator.hasVibrator());
            result.put("canScheduleExact", canScheduleExact(context));
            call.resolve(result);
        } catch (Throwable t) {
            fail(call, "diagnose", t);
        }
    }

    @PluginMethod
    public void isRinging(PluginCall call) {
        try {
            JSObject result = new JSObject();
            result.put("ringing", RestAlarmReceiver.isNotificationActive(getContext()));
            call.resolve(result);
        } catch (Throwable t) {
            fail(call, "isRinging", t);
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        try {
            Context context = getContext();
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

            // Same class and no action, so this matches the pending alarm created in start().
            PendingIntent existing = PendingIntent.getBroadcast(
                context,
                REQUEST_TRIGGER,
                new Intent(context, RestAlarmReceiver.class),
                PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
            );
            if (existing != null && alarmManager != null) {
                alarmManager.cancel(existing);
                existing.cancel();
            }

            // Also silences a notification that is already buzzing.
            RestAlarmReceiver.cancelNotification(context);
            call.resolve();
        } catch (Throwable t) {
            fail(call, "stop", t);
        }
    }
}
