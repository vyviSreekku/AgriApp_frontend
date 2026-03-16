error id: file:///D:/FINAL_YEAR/React_App_new/AgriApp_frontend_and_backend/App/node_modules/onnxruntime-react-native/android/src/main/java/ai/onnxruntime/reactnative/OnnxruntimePackage.java:com/facebook/react/ReactPackage#
file:///D:/FINAL_YEAR/React_App_new/AgriApp_frontend_and_backend/App/node_modules/onnxruntime-react-native/android/src/main/java/ai/onnxruntime/reactnative/OnnxruntimePackage.java
empty definition using pc, found symbol in pc: com/facebook/react/ReactPackage#
empty definition using semanticdb
empty definition using fallback
non-local guesses:

offset: 261
uri: file:///D:/FINAL_YEAR/React_App_new/AgriApp_frontend_and_backend/App/node_modules/onnxruntime-react-native/android/src/main/java/ai/onnxruntime/reactnative/OnnxruntimePackage.java
text:
```scala
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package ai.onnxruntime.reactnative;

import android.os.Build;
import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;
import com.facebook.react.@@ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.modules.blob.BlobModule;
import com.facebook.react.uimanager.ViewManager;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class OnnxruntimePackage implements ReactPackage {
  @RequiresApi(api = Build.VERSION_CODES.N)
  @NonNull
  @Override
  public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
    List<NativeModule> modules = new ArrayList<>();
    modules.add(new OnnxruntimeModule(reactContext));
    return modules;
  }

  @NonNull
  @Override
  public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext reactContext) {
    return Collections.emptyList();
  }
}

```


#### Short summary: 

empty definition using pc, found symbol in pc: com/facebook/react/ReactPackage#