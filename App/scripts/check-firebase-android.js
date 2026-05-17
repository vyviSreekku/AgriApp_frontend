const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const androidJson = path.join(projectRoot, 'android', 'app', 'google-services.json');

if (fs.existsSync(androidJson)) {
  console.log('Found android/app/google-services.json ✅');
  process.exit(0);
} else {
  console.error('Missing android/app/google-services.json ⚠️');
  console.error('Place the file you download from Firebase Console here: android/app/google-services.json');
  console.error('\nChecklist to get Phone Auth working on Android:');
  console.error('- Register your Android app in Firebase Console with the applicationId/package name.');
  console.error('- Add the generated google-services.json to android/app/');
  console.error('- Add your app SHA-1 (and SHA-256) in Firebase Console (Project settings → Your apps → Add fingerprint).');
  console.error('- Rebuild the Android app: gradle/Android Studio or `npx react-native run-android`');
  process.exit(2);
}
