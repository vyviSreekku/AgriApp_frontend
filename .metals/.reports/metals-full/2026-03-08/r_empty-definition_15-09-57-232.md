error id: file:///D:/FINAL_YEAR/React_App_new/AgriApp_frontend_and_backend/App/android/app/build/generated/autolinking/src/main/java/com/facebook/react/PackageList.java:com/facebook/react/ReactPackage#
file:///D:/FINAL_YEAR/React_App_new/AgriApp_frontend_and_backend/App/android/app/build/generated/autolinking/src/main/java/com/facebook/react/PackageList.java
empty definition using pc, found symbol in pc: com/facebook/react/ReactPackage#
empty definition using semanticdb
empty definition using fallback
non-local guesses:

offset: 158
uri: file:///D:/FINAL_YEAR/React_App_new/AgriApp_frontend_and_backend/App/android/app/build/generated/autolinking/src/main/java/com/facebook/react/PackageList.java
text:
```scala
package com.facebook.react;

import android.app.Application;
import android.content.Context;
import android.content.res.Resources;

import com.facebook.react.@@ReactPackage;
import com.facebook.react.shell.MainPackageConfig;
import com.facebook.react.shell.MainReactPackage;
import java.util.Arrays;
import java.util.ArrayList;

// @react-native-async-storage/async-storage
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage;
// @react-native-community/netinfo
import com.reactnativecommunity.netinfo.NetInfoPackage;
// expo
import expo.modules.ExpoModulesPackage;
// lottie-react-native
import com.airbnb.android.react.lottie.LottiePackage;
// react-native-fs
import com.rnfs.RNFSPackage;
// react-native-gesture-handler
import com.swmansion.gesturehandler.RNGestureHandlerPackage;
// react-native-location
import com.github.reactnativecommunity.location.RNLocationPackage;
// react-native-reanimated
import com.swmansion.reanimated.ReanimatedPackage;
// react-native-safe-area-context
import com.th3rdwave.safeareacontext.SafeAreaContextPackage;
// react-native-screens
import com.swmansion.rnscreens.RNScreensPackage;
// react-native-svg
import com.horcrux.svg.SvgPackage;
// react-native-worklets
import com.swmansion.worklets.WorkletsPackage;

@SuppressWarnings("deprecation")
public class PackageList {
  private Application application;
  private ReactNativeHost reactNativeHost;
  private MainPackageConfig mConfig;

  public PackageList(ReactNativeHost reactNativeHost) {
    this(reactNativeHost, null);
  }

  public PackageList(Application application) {
    this(application, null);
  }

  public PackageList(ReactNativeHost reactNativeHost, MainPackageConfig config) {
    this.reactNativeHost = reactNativeHost;
    mConfig = config;
  }

  public PackageList(Application application, MainPackageConfig config) {
    this.reactNativeHost = null;
    this.application = application;
    mConfig = config;
  }

  private ReactNativeHost getReactNativeHost() {
    return this.reactNativeHost;
  }

  private Resources getResources() {
    return this.getApplication().getResources();
  }

  private Application getApplication() {
    if (this.reactNativeHost == null) return this.application;
    return this.reactNativeHost.getApplication();
  }

  private Context getApplicationContext() {
    return this.getApplication().getApplicationContext();
  }

  public ArrayList<ReactPackage> getPackages() {
    return new ArrayList<>(Arrays.<ReactPackage>asList(
      new MainReactPackage(mConfig),
      new AsyncStoragePackage(),
      new NetInfoPackage(),
      new ExpoModulesPackage(),
      new LottiePackage(),
      new RNFSPackage(),
      new RNGestureHandlerPackage(),
      new RNLocationPackage(),
      new ReanimatedPackage(),
      new SafeAreaContextPackage(),
      new RNScreensPackage(),
      new SvgPackage(),
      new WorkletsPackage()
    ));
  }
}
```


#### Short summary: 

empty definition using pc, found symbol in pc: com/facebook/react/ReactPackage#