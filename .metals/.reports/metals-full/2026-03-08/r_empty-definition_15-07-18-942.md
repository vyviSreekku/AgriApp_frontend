error id: file:///D:/FINAL_YEAR/React_App_new/AgriApp_frontend_and_backend/App/android/app/src/main/java/com/smolchatrn/LLMModulePackage.java:com/facebook/react/ReactPackage#
file:///D:/FINAL_YEAR/React_App_new/AgriApp_frontend_and_backend/App/android/app/src/main/java/com/smolchatrn/LLMModulePackage.java
empty definition using pc, found symbol in pc: com/facebook/react/ReactPackage#
empty definition using semanticdb
empty definition using fallback
non-local guesses:

offset: 53
uri: file:///D:/FINAL_YEAR/React_App_new/AgriApp_frontend_and_backend/App/android/app/src/main/java/com/smolchatrn/LLMModulePackage.java
text:
```scala
package com.smolchatrn;

import com.facebook.react.@@ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class LLMModulePackage implements ReactPackage {

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new LLMModule(reactContext));
        return modules;
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}

```


#### Short summary: 

empty definition using pc, found symbol in pc: com/facebook/react/ReactPackage#