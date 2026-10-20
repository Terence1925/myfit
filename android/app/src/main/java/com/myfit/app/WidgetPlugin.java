package com.myfit.app;

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Lets the app update the home-screen widget. update() receives today's summary (see src/lib/widgetData.ts), stores it and
 * redraws every MyFit widget; clear() removes it (signing out), so the widget goes back to "Open MyFit".
 *
 * Every method catches Throwable and reports it back instead of letting it take the app down.
 */
@CapacitorPlugin(name = "MyFitWidget")
public class WidgetPlugin extends Plugin {

    private static final String TAG = "MyFitWidget";

    @PluginMethod
    public void update(PluginCall call) {
        try {
            JSObject data = call.getData();
            MyFitWidgetProvider.save(getContext(), data.toString());
            MyFitWidgetProvider.updateAll(getContext());
            call.resolve();
        } catch (Throwable t) {
            Log.e(TAG, "update failed", t);
            call.reject("Could not update the widget: " + t.getMessage());
        }
    }

    @PluginMethod
    public void clear(PluginCall call) {
        try {
            MyFitWidgetProvider.save(getContext(), null);
            MyFitWidgetProvider.updateAll(getContext());
            call.resolve();
        } catch (Throwable t) {
            Log.e(TAG, "clear failed", t);
            call.reject("Could not clear the widget: " + t.getMessage());
        }
    }
}
