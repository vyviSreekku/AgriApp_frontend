# Firebase setup (Android & iOS)

Follow these steps to enable Firebase Phone OTP for the mobile app.

## Android

1. In Firebase Console, create or open your project.
2. Add an Android app with the package name matching `android/app/build.gradle` `applicationId` (e.g. `com.planthub`).
3. Download the `google-services.json` and place it at `android/app/google-services.json`.
4. Add your app's SHA-1 and SHA-256 fingerprints in Firebase Console (Project settings → Your apps → Add fingerprint).
   - To get fingerprints on Windows, run from project root:

```
cd android
gradlew.bat signingReport
```

5. Rebuild the Android app:

```
npx react-native run-android
```

6. (Optional) For testing without sending SMS, add test phone numbers in Firebase Console → Authentication → Sign-in method → Phone → Phone numbers for testing.

## iOS

1. In Firebase Console, add an iOS app with the correct bundle id.
2. Download `GoogleService-Info.plist` and add it to your Xcode project (usually copy to `ios/` and add to the Runner target).
3. Run `pod install` in the `ios/` directory:

```
cd ios
pod install
```

## Notes

- Do NOT commit `google-services.json` or `GoogleService-Info.plist` to public repos. Use the template provided at `android/app/google-services.json.template` for reference.
- For Expo-managed workflows, follow the Expo docs for adding Firebase config files.