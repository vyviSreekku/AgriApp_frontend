package com.smolchatrn;

import android.util.Log;
import java.io.File;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class LLMModule extends ReactContextBaseJavaModule {
    private static final String TAG = "LLMModule";

    public LLMModule(ReactApplicationContext reactContext) {
        super(reactContext);
        Log.i(TAG, "LLMModule initialized");
    }


    @Override
    public String getName() {
        return "LLMModule";
    }

    static {
        try {
            System.loadLibrary("appmodules"); // Corresponds to project name in CMakeLists.txt
            Log.i(TAG, "appmodules library loaded successfully");
        } catch (UnsatisfiedLinkError e) {
            Log.e(TAG, "Failed to load appmodules library", e);
        }
    }

    @ReactMethod
    public void loadModel(ReadableMap config, Promise promise) {
        try {
            String modelPath = config.getString("modelPath");
            float minP = (float) config.getDouble("minP");
            float temperature = (float) config.getDouble("temperature");
            boolean storeChats = config.getBoolean("storeChats");
            long contextSize = config.getInt("contextSize");
            String chatTemplate = null;
            if (config.hasKey("chatTemplate") && config.getType("chatTemplate") != ReadableType.Null) {
                chatTemplate = config.getString("chatTemplate");
            }
            int nThreads = config.getInt("nThreads");
            int nThreadsBatch = config.hasKey("nThreadsBatch") ? config.getInt("nThreadsBatch") : nThreads;
            int batchSize = config.hasKey("batchSize") ? config.getInt("batchSize") : (int) contextSize;
            int microBatchSize = config.hasKey("microBatchSize") ? config.getInt("microBatchSize") : batchSize;
            int maxOutputTokens = config.hasKey("maxOutputTokens") ? config.getInt("maxOutputTokens") : 80;
            int flashAttentionType = config.hasKey("flashAttentionType") ? config.getInt("flashAttentionType") : -1;
            boolean offloadKqv = config.hasKey("offloadKqv") && config.getBoolean("offloadKqv");
            boolean useMmap = config.getBoolean("useMmap");
            boolean useMlock = config.getBoolean("useMlock");

            Log.i(TAG, "loadModel called with path: " + modelPath);

            // Defensive check: ensure the model file is present before calling native code.
            if (modelPath == null || modelPath.isEmpty()) {
                Log.e(TAG, "loadModel failed: modelPath is null or empty");
                promise.reject("MODEL_FILE_MISSING", "modelPath is null or empty");
                return;
            }

            File f = new File(modelPath);
            if (!f.exists() || !f.canRead()) {
                Log.e(TAG, "loadModel failed: model file does not exist or is not readable: " + modelPath);
                promise.reject("MODEL_FILE_MISSING", "Model file missing or not readable: " + modelPath);
                return;
            }

            try {
                nativeInit(modelPath, minP, temperature, storeChats, contextSize, chatTemplate, nThreads, nThreadsBatch, batchSize, microBatchSize, maxOutputTokens, flashAttentionType, offloadKqv, useMmap, useMlock);
            } catch (UnsatisfiedLinkError ule) {
                Log.e(TAG, "Native library or symbol missing during nativeInit", ule);
                promise.reject("NATIVE_LIB_ERROR", ule.getMessage());
                return;
            } catch (Throwable t) {
                Log.e(TAG, "Unexpected error during nativeInit", t);
                promise.reject("NATIVE_INIT_ERROR", t.getMessage());
                return;
            }

            try {
                if (!nativeIsModelReady()) {
                    Log.e(TAG, "nativeInit completed but model is not ready");
                    promise.reject("MODEL_LOAD_FAILED", "Native model initialization failed");
                    return;
                }
            } catch (Throwable t) {
                Log.e(TAG, "Error while checking native model readiness", t);
                promise.reject("MODEL_READY_CHECK_FAILED", t.getMessage());
                return;
            }

            Log.i(TAG, "Model loaded successfully via nativeInit");
            promise.resolve(true);

        } catch (Exception e) {
            Log.e(TAG, "Exception in loadModel", e);
            promise.reject("ERROR", e.getMessage());
        }
    }

    private static class TokenCallback {
        private final ReactApplicationContext reactContext;

        TokenCallback(ReactApplicationContext context) {
            this.reactContext = context;
        }

        @SuppressWarnings("unused") // Called from Native C++
        public void invoke(String token) {
            // Ensure we emit events on the UI thread (or main looper) to be safe, 
            // though RN bridge usually handles threads. 
            // Using a Handler ensures we don't crash from a bg thread.
            new android.os.Handler(android.os.Looper.getMainLooper()).post(() -> {
                if (reactContext.hasActiveCatalystInstance()) {
                    reactContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("onToken", token);
                }
            });
        }
    }

    @ReactMethod
    public void generateResponse(String prompt, Callback ignoredCallback) {
        try {
            if (!nativeIsModelReady()) {
                Log.e(TAG, "generateResponse called before model was ready");
                // Emit an error event to JS so frontend can surface a friendly message
                try {
                    if (getReactApplicationContext().hasActiveCatalystInstance()) {
                        getReactApplicationContext()
                            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                            .emit("onError", "Model not initialized");
                    }
                } catch (Throwable t) {
                    Log.w(TAG, "Failed to emit onError event", t);
                }
                return;
            }
            Log.i(TAG, "generateResponse called with prompt: " + prompt);
            // We ignore the JS callback and use DeviceEventEmitter instead
            // because standard RN Callbacks are one-shot (cannot be called multiple times).
            TokenCallback nativeCallback = new TokenCallback(getReactApplicationContext());
            nativeGenerate(prompt, nativeCallback);
        } catch (Exception e) {
            Log.e(TAG, "Exception in generateResponse", e);
        }
    }

    @ReactMethod
    public void bench(ReadableMap config, Promise promise) {
        try {
            int pp = config.getInt("pp");
            int tg = config.getInt("tg");
            int pl = config.getInt("pl");
            int nr = config.getInt("nr");
            String report = nativeBench(pp, tg, pl, nr);
            promise.resolve(report);
        } catch (Exception e) {
            promise.reject("BENCH_ERROR", e);
        }
    }

    @ReactMethod
    public void release(Promise promise) {
        try {
            nativeRelease();
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("RELEASE_ERROR", e);
        }
    }

    @ReactMethod
    public void resetConversation(Promise promise) {
        try {
            nativeResetConversation();
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("RESET_ERROR", e);
        }
    }

    @ReactMethod
    public void isModelReady(Promise promise) {
        try {
            promise.resolve(nativeIsModelReady());
        } catch (Exception e) {
            promise.reject("READY_STATE_ERROR", e);
        }
    }

    // Native method declarations
    private native void nativeInit(String modelPath, float minP, float temp, boolean storeChats, long contextSize, String chatTemplate, int nThreads, int nThreadsBatch, int batchSize, int microBatchSize, int maxOutputTokens, int flashAttentionType, boolean offloadKqv, boolean useMmap, boolean useMlock);
    private native void nativeGenerate(String userPrompt, Object tokenCallback);
    private native String nativeBench(int pp, int tg, int pl, int nr);
    private native void nativeRelease();
    private native void nativeResetConversation();
    private native boolean nativeIsModelReady();
}