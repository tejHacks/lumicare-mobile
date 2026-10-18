# LumiCare

**Offline-first newborn care support for noticing concerns, keeping records, and following up.**

LumiCare is a mobile prototype for caregivers and community health workers. It brings newborn jaundice education, a guided eye-photo workflow, on-device records, care contacts, and follow-up reminders together in one app. Its aim is to make the next step easier to understand and keep important care information available when connectivity is limited.

> **Prototype and safety notice**
> LumiCare is not a medical device and does not diagnose, rule out, or treat jaundice. Its on-device image model is an engineering-evaluation prototype, not clinically validated. A reassuring app result must never delay assessment by a qualified health professional. Seek urgent care for danger signs or if concerned about a newborn.

## Product at a glance

- **Mobile:** Expo SDK 57, React Native 0.86, TypeScript, and Expo Router.
- **Offline-first by design:** profiles, preferences, saved screening records, reminders, and bundled education are intended to work on-device; no cloud patient-record service is implemented.
- **Photo input:** take an eye photo with the camera or choose an existing image from the device gallery.
- **Image analysis:** every scan uses the bundled ONNX model in a custom native build. Expo Go cannot run scans because it does not contain ONNX Runtime; no simulated results are generated.
- **Languages offered in the selector:** English, Yoruba, Igbo, Hausa, French, Twi, Swahili, Zulu, Xhosa, Afrikaans, Amharic, Somali, Kinyarwanda, Luganda, Shona, Chichewa, Wolof, Lingala, Fulfulde, and Arabic. Translation completeness and clinical wording should be reviewed with fluent speakers before wider use.
- **Platform:** Android preview APK is available through EAS internal distribution. iOS/native model builds have not been validated for release.

## What the app currently does

### 1. Onboarding and baby profile

A short introduction leads into a caregiver profile and newborn details. The app lets a caregiver choose a language, enter a baby name and date of birth, and continue to the home screen. The profile and preferences are saved locally.

### 2. Learn and prepare

The education guide covers visible signs, urgent warning signs, feeding support, and the need for professional assessment. Before scanning, the workflow displays photo guidance: use bright, even light without flash, make the white of the eye visible, and do not wait for an app result if the baby seems unwell.

### 3. Capture or select an image

The scan flow validates the baby name and date of birth, then offers the camera or device gallery. The chosen image is resized and saved into the app's local documents area before analysis. The preview screen lets the user review the image before continuing.

### 4. On-device model evaluation

In an Android or iOS custom native build, the scan flow runs the bundled `sclera_detector.onnx` model through ONNX Runtime on the device CPU. The scan service always calls the on-device model; there is no demo-result fallback. Expo Go does not include ONNX Runtime, so it cannot perform a scan. The pipeline:

1. Decodes the saved JPEG, resizes/letterboxes it to 640×640, and creates the model tensor.
2. Runs YOLOv8 segmentation with embedded NMS to identify sclera regions.
3. Builds a sclera mask and calculates a prototype yellow-pixel index.
4. Applies a port of the checked-in one-feature linear SVC classifier and maps its two legacy classes to the app's three display states.
5. Saves the result, date, baby details, and local image path when possible.

The displayed states are **No yellowing detected**, **Possible jaundice**, and **Image not clear enough**. They are provisional interface labels for engineering evaluation only, not validated medical thresholds or recommendations. Each result is marked as evaluation-only in saved records and exports.

### 5. Records, follow-up, and sharing

- Review saved records and their source images; select records, export PDF reports, or delete records and their local images.
- Save a referral contact and share a short text summary or a PDF containing screening records.
- Create locally stored follow-up reminders. Native scheduled notifications are attempted when supported and permission is granted; a saved reminder is retained if scheduling is unavailable.
- Change language and export record metadata from Settings.

The SQLite database is configured for SQLCipher on native platforms with its key stored in SecureStore. Screening image files are kept separately in app-private document storage; they are not encrypted by SQLCipher. Do not treat the database setting as proof that image files or device backups meet a production health-data security policy.

## Current evidence and limitations

- The ONNX conversion was checked against the source PyTorch model on the repository's sample images; the checked-in manifest states that mobile image parity still requires device validation.
- Unit tests cover routed-screen rendering, the ported classifier's boundary/class behavior, and PDF generation. They do **not** replace real-phone camera/gallery, native inference, notification, storage, performance, or clinical validation.
- The latest EAS Android preview is an internal APK build intended for testing on arm64 Android phones. It is not a Play Store release.
- There is no patient-data backend, clinician dashboard, laboratory connection, remote monitoring, or telecommunications integration implemented. These are opportunities for a future partner-led pilot—not current product capabilities.
- Model accuracy, sensitivity, specificity, safe referral thresholds, device-to-device parity, and clinical usefulness have not been established. Do not present benchmark, impact, or diagnostic-performance claims without a documented study.

## Install the current Android preview

The latest completed internal APK is **version code 2**. Download it from the [EAS build page](https://expo.dev/accounts/tejcodes/projects/Lumicare/builds/9ed84676-66f3-4ad3-990e-900a6fbaff96). On the Android phone, open the downloaded APK and allow installation from that source if Android asks. The link is for internal testing and may expire; the EAS page has the current artifact.

The preview contains native ONNX Runtime and SQLCipher modules. **Expo Go cannot run the bundled model or SQLCipher path**; use the preview APK or a custom development build.

## Test a selected image on Android

Use an arm64 Android phone and a clear, permissioned eye image. For initial engineering checks, use a consented project test image where possible—not a private infant photo or an image shared without permission.

1. Install the latest preview APK and open LumiCare. Complete onboarding and enter a test baby name and date of birth.
2. Open **Screen baby** and begin the guided flow.
3. Tap **Upload image** (or the gallery button in the camera screen), select a JPEG image, and wait for image preparation. Review the preview, then tap **Start screening**.
4. On the first run, allow extra time for the model file to be copied into app cache and the ONNX session to initialize. Keep the app open and the phone awake. Later scans in the same app session should reuse the initialized session.
5. Record the elapsed time separately for image preparation and analysis, the displayed state, whether the app saved a record, and whether an error occurred. Repeat a second time with the same file to compare warm-start behavior.
6. Try one clear eye image, one image where the eye is not visible, and one deliberately difficult image (blur/poor light). Verify that an unusable image does not produce a confident-looking result and that records can be viewed and deleted.
7. Check **Screening records** to confirm the image and evaluation label are saved. Delete test records and images when finished.

Do not interpret a test result as a baby's health status. Use only consented test images. If the model takes an unusually long time, note the phone model, Android version, image dimensions/file size, and approximate wait time; do not keep tapping the scan button while inference is running.

## Development

### Requirements

- Node.js compatible with the installed Expo SDK and npm.
- For local native Android builds: Android Studio, Android SDK/platform tools, Java 17, and `ANDROID_HOME` or `ANDROID_SDK_ROOT`.
- Expo Go is suitable only for features its runtime supports; native ONNX/SQLCipher evaluation needs a custom development build or the EAS preview APK.

### Install and run JavaScript checks

```sh
npm ci
npx tsc --noEmit
npm test -- --silent
npm run lint
npx expo-doctor
```

The current repo has known lint findings in existing React Compiler/hooks patterns; review the command output rather than treating a passing test suite as a release certification.

### Build or run the local-model Android app

```sh
npx expo install --check
npm run android:local-model
```

For JS-only edits after installing the custom development client:

```sh
npm run start:local-model
```

The preview profile sets `EXPO_PUBLIC_ENABLE_LOCAL_MODEL=true`, creates an internal APK, and uses the model-bearing native build. To create another cloud preview:

```sh
npx eas-cli build --platform android --profile preview
```

The `onnxruntime-react-native` Gradle compatibility patch is stored under `patches/` and applied by the package `postinstall` script. Do not patch `node_modules` alone; clean cloud installs would discard that edit.

## Model artifact workflow

The model artifacts and reproducible export/verification scripts are in [assets/ml](assets/ml/README.md). The YOLO segmentation model is exported from `files/sclera_detector.pt`; the lightweight classifier parameters are stored in JSON for JavaScript inference. Regenerating artifacts is an engineering task and must be followed by the image-parity checks and device validation described above.

## MTN partnership / pilot opportunity

LumiCare is a prototype for exploring how **offline-capable mobile workflows and accessible local-language education** could support newborn-care follow-up in connectivity-constrained communities. A responsible next step with MTN would be a **supervised discovery and validation pilot**, not a claim that a diagnostic model is ready for deployment:

- Co-design the workflow with caregivers, community health workers, neonatal clinicians, and local-language reviewers.
- Test usability and offline resilience on a defined set of Android devices and network conditions.
- Agree consent, privacy, retention, referral, escalation, and clinical-governance requirements before collecting real health data.
- Conduct a properly reviewed, clinically supervised model-validation study before considering any screening claims.
- Explore future connectivity or referral integrations only after a partner approves the architecture and data-protection design.

**Current ask:** partner with the team on user research, device/connectivity testing, and a clinically governed pilot plan. No MTN service, network integration, or endorsement is currently implemented or implied.

## License

See [LICENSE](LICENSE).
# lumicare-mobile
