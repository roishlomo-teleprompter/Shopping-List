Native fix patch for Android speech recognition

File replaced:
node_modules/@capgo/capacitor-speech-recognition/android/src/main/java/app/capgo/speechrecognition/SpeechRecognitionPlugin.java

What changed:
- Fresh recognizer per session
- Immediate cancel/destroy on manual stop
- Safe reading of android.speech.extra.UNSTABLE_TEXT
- Single stopped event emission guard
- Ignore stale callbacks from older sessions
- Reduced second-press failure caused by recognizer reuse/race

How to apply:
1. Extract this patch at the project root and overwrite files.
2. Run:
   npm run build
   npx cap copy android
   npx cap sync android
3. In Android Studio:
   Build -> Clean Project
   Build -> Assemble Project
   Run
