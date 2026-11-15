package com.myfit.app;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;

import androidx.annotation.RequiresApi;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.IOException;
import java.io.OutputStream;

/**
 * Saves a file straight into the phone's Downloads folder (Android 10 and newer), with no permission needed.
 * On older phones it rejects with "unsupported" and the app falls back to the share sheet.
 *
 * Every method catches Throwable and reports it back to the app instead of letting it take the app down.
 */
@CapacitorPlugin(name = "Downloads")
public class DownloadsPlugin extends Plugin {

    private static final String TAG = "Downloads";

    @PluginMethod
    public void saveFile(PluginCall call) {
        try {
            String fileName = call.getString("fileName");
            String data = call.getString("data");
            String mimeType = call.getString("mimeType", "application/pdf");
            if (fileName == null || data == null) {
                call.reject("fileName and data are required");
                return;
            }
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
                call.reject("unsupported");
                return;
            }
            String uri = saveToDownloads(fileName, Base64.decode(data, Base64.DEFAULT), mimeType);
            JSObject result = new JSObject();
            result.put("uri", uri);
            call.resolve(result);
        } catch (Throwable t) {
            Log.e(TAG, "saveFile failed", t);
            call.reject(t.getMessage() != null ? t.getMessage() : "Could not save the file");
        }
    }

    @RequiresApi(api = Build.VERSION_CODES.Q)
    private String saveToDownloads(String fileName, byte[] bytes, String mimeType) throws IOException {
        ContentResolver resolver = getContext().getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
        values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
        values.put(MediaStore.MediaColumns.RELATIVE_PATH, "Download");
        values.put(MediaStore.MediaColumns.IS_PENDING, 1);
        Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
        if (uri == null) throw new IOException("Could not create the file");
        try (OutputStream out = resolver.openOutputStream(uri)) {
            if (out == null) throw new IOException("Could not open the file");
            out.write(bytes);
        }
        ContentValues done = new ContentValues();
        done.put(MediaStore.MediaColumns.IS_PENDING, 0);
        resolver.update(uri, done, null, null);
        return uri.toString();
    }
}
