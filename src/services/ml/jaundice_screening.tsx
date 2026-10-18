export type ScreeningStatus = "clear" | "possible" | "inconclusive";

export type ScreeningResult = {
  status: ScreeningStatus;
  source: "on-device-model";
  /** Model outputs are engineering evaluations, not clinically validated results. */
  evaluationOnly: true;
};

type OnDeviceModelModule = typeof import("./local_jaundice_model");

export async function analyzeEyeImage(
  imageUri: string,
  loadModel: () => Promise<OnDeviceModelModule> = () => import("./local_jaundice_model"),
): Promise<ScreeningResult> {
  // No synthetic result path: every returned status comes from ONNX inference.
  // Expo Go lacks ONNX Runtime and will reject this import; the caller reports
  // that a custom development or production build is required.
  const { analyzeEyeImageOnDevice } = await loadModel();
  return analyzeEyeImageOnDevice(imageUri);
}