# LumiCare mobile ML artifacts

These files are a **conversion/evaluation build**, not a clinically validated diagnostic system.

- `sclera_detector.onnx`: exported from `files/sclera_detector.pt` using Ultralytics 8.4.177, ONNX opset 17, 640x640 fixed input, batch 1, embedded NMS. It is a YOLOv8 segmentation model with classes `iris=0`, `sclera=1`.
- `jaundice_classifier.json`: exact linear coefficients and threshold extracted from the checked-in scikit-learn SVC. The application uses JavaScript arithmetic rather than trying to load a pickle file on-device.
- `manifest.json`: model input/output tensor contract and classifier metadata.
- `export_models.py`, `export_classifier.py`, `requirements-export.txt`: reproducible Python-side conversion/verification utilities.

## Regenerate the artifacts

Create a Python 3.14 CPU environment (Python 3.12+ is also suitable), install `requirements-export.txt`, then run `python assets/ml/export_classifier.py` and `python assets/ml/export_models.py --yolo-only`. The classifier exporter validates the JSON coefficients against the checked-in pickle; the YOLO exporter validates the ONNX graph and tensor contract. `python assets/ml/verify_onnx.py` compares the PyTorch and ONNX model outputs on the sample photos in `assets/`.

## Local mobile evaluation

The React Native implementation is in `src/services/ml/local_jaundice_model.ts`. A local Expo config plugin copies the ONNX file to Android app assets and iOS bundle resources; the model is copied into the app cache on first use so ONNX Runtime can open it as a filesystem path. On Android, the asset is read from `Paths.bundle/sclera_detector.onnx`; the iOS build resolves it as a named bundle resource. The scan flow always calls this model and has no simulated-result fallback. **Expo Go cannot load SQLCipher or ONNX Runtime's native module**, so scanning requires a custom native development or release build.

For Android, install Android Studio and the Android SDK/platform tools, set `ANDROID_HOME` (or `ANDROID_SDK_ROOT`), then run `npm run android:local-model`. That command generates the CNG Android project, builds/installs a custom development client, and enables the local model path. For later JS-only changes use `npm run start:local-model` with that development client. On macOS, use `cross-env EXPO_PUBLIC_ENABLE_LOCAL_MODEL=true npx expo run:ios` for iOS. Any change to the native package, app plugins, or bundled ONNX file requires rebuilding the development client.

Before using with families, compare the mobile implementation with the Python reference over the same held-out images, check segmentation masks and Jaundice Index parity, resolve output semantics with clinical reviewers, and conduct appropriate validation. Current legacy class labels are counterintuitive: sklearn class `0` means `Jaundice` while class `1` means `NO-Jaundice`. A `NO-Jaundice` model class is not a medical rule-out.
