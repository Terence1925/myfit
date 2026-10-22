package com.myfit.app;

import android.os.Bundle;
import android.os.SystemClock;

import androidx.core.splashscreen.SplashScreen;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    /** The opening logo stays at least this long, so it never flashes by and leaves a dark gap before the first screen. */
    private static final long SPLASH_MIN_MS = 1000;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Must run before super.onCreate().
        final long start = SystemClock.uptimeMillis();
        SplashScreen splash = SplashScreen.installSplashScreen(this);
        splash.setKeepOnScreenCondition(() -> SystemClock.uptimeMillis() - start < SPLASH_MIN_MS);

        // Local plugins must be registered before super.onCreate().
        registerPlugin(RestAlarmPlugin.class);
        registerPlugin(WidgetPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
