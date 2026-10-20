package com.myfit.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * The MyFit home-screen widget: today's workout and the weekly streak.
 *
 * The app (see WidgetPlugin and src/lib/widgetSync.ts) saves a small JSON summary here whenever something changes;
 * this class only draws it. A wide widget (about 4 cells) shows the greeting, streak, next workout, the week's dots and a
 * Start button. A small one (about 2 cells) shows the workout and a progress bar. Before the app has sent anything (or
 * after signing out) it shows "Open MyFit to set up your plan". Tapping the widget opens the app.
 *
 * Colours come from res/values/widget_colors.xml and res/values-night, so it follows the phone's light or dark mode.
 */
public class MyFitWidgetProvider extends AppWidgetProvider {

    private static final String TAG = "MyFitWidget";
    static final String PREFS = "myfit_widget";
    static final String KEY_DATA = "data";

    /** At least this wide (in dp) and the wide layout is used. */
    private static final int WIDE_MIN_DP = 220;

    private static final int[] DOT_IDS = {
        R.id.wg_d0, R.id.wg_d1, R.id.wg_d2, R.id.wg_d3, R.id.wg_d4, R.id.wg_d5, R.id.wg_d6,
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int id : appWidgetIds) update(context, manager, id);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int appWidgetId, Bundle newOptions) {
        update(context, manager, appWidgetId);
    }

    /** Redraws every MyFit widget on the home screen. */
    public static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, MyFitWidgetProvider.class));
        for (int id : ids) update(context, manager, id);
    }

    static void save(Context context, String json) {
        SharedPreferences.Editor editor = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit();
        if (json == null) editor.remove(KEY_DATA);
        else editor.putString(KEY_DATA, json);
        editor.apply();
    }

    private static JSONObject load(Context context) {
        try {
            String json = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_DATA, null);
            return json == null ? null : new JSONObject(json);
        } catch (Throwable t) {
            Log.w(TAG, "could not read the widget data", t);
            return null;
        }
    }

    private static void update(Context context, AppWidgetManager manager, int appWidgetId) {
        RemoteViews views;
        try {
            JSONObject data = load(context);
            Bundle options = manager.getAppWidgetOptions(appWidgetId);
            boolean wide = options != null && options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0) >= WIDE_MIN_DP;
            if (data == null) views = new RemoteViews(context.getPackageName(), R.layout.widget_empty);
            else if (wide) views = wide(context, data);
            else views = small(context, data);
        } catch (Throwable t) {
            // Never let a bad value crash the launcher: fall back to the plain card
            Log.e(TAG, "could not draw the widget", t);
            views = new RemoteViews(context.getPackageName(), R.layout.widget_empty);
        }
        views.setOnClickPendingIntent(R.id.wg_root, openApp(context));
        manager.updateAppWidget(appWidgetId, views);
    }

    private static PendingIntent openApp(Context context) {
        Intent intent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (intent == null) intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(context, 0, intent, flags);
    }

    private static RemoteViews wide(Context context, JSONObject data) throws Exception {
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_wide);
        v.setTextViewText(R.id.wg_greeting, data.optString("greeting", ""));
        int weeks = data.optInt("streakWeeks", 0);
        v.setTextViewText(R.id.wg_streak, "🔥 " + weeks + (weeks == 1 ? " week" : " weeks"));
        v.setTextViewText(R.id.wg_label, data.optString("label", ""));
        v.setTextViewText(R.id.wg_name, data.optString("name", ""));
        v.setTextViewText(R.id.wg_meta, data.optString("meta", ""));

        JSONArray dots = data.optJSONArray("dots");
        for (int i = 0; i < DOT_IDS.length; i++) {
            JSONObject dot = dots != null ? dots.optJSONObject(i) : null;
            boolean done = dot != null && dot.optBoolean("d");
            boolean today = dot != null && dot.optBoolean("t");
            String label = dot != null ? dot.optString("l", "") : "";
            v.setTextViewText(DOT_IDS[i], done ? "✓" : label);
            if (done) {
                v.setInt(DOT_IDS[i], "setBackgroundResource", R.drawable.wg_dot_done);
                v.setTextColor(DOT_IDS[i], context.getColor(R.color.wg_on_lime));
            } else if (today) {
                v.setInt(DOT_IDS[i], "setBackgroundResource", R.drawable.wg_dot_today);
                v.setTextColor(DOT_IDS[i], context.getColor(R.color.wg_accent));
            } else {
                v.setInt(DOT_IDS[i], "setBackgroundResource", R.drawable.wg_dot_off);
                v.setTextColor(DOT_IDS[i], context.getColor(R.color.wg_muted));
            }
        }
        // Nothing left to start this week: the button gives way to a plain "Open"
        v.setTextViewText(R.id.wg_start, data.optBoolean("allDone", false) ? "Open" : "Start");
        return v;
    }

    private static RemoteViews small(Context context, JSONObject data) {
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_small);
        v.setTextViewText(R.id.wg_name, data.optString("name", ""));
        v.setTextViewText(R.id.wg_meta, data.optString("meta", ""));
        int planned = Math.max(1, data.optInt("planned", 1));
        int done = Math.max(0, Math.min(planned, data.optInt("done", 0)));
        v.setProgressBar(R.id.wg_bar, planned, done, false);
        v.setTextViewText(R.id.wg_caption, data.optString("caption", ""));
        return v;
    }
}
