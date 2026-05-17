@echo off
REM Script to run Gradle signingReport and help locate SHA-1/SHA-256 fingerprints
cd android
if exist gradlew.bat (
  gradlew.bat signingReport
) else (
  echo gradlew.bat not found. Open Android Studio and run the signing report, or run this from the project root.
)

echo.
echo Look for lines like:
echo "Variant: debug"
echo "  SHA1: <value>"
echo "  SHA-256: <value>"
