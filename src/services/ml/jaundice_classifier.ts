import classifier from "../../../assets/ml/jaundice_classifier.json";
import type { ScreeningStatus } from "./jaundice_screening";

export function predictLegacyJaundiceClass(jaundiceIndex: number) {
  if (!Number.isFinite(jaundiceIndex) || jaundiceIndex < 0 || jaundiceIndex > 1) {
    throw new RangeError("Jaundice Index must be a finite value between 0 and 1.");
  }
  const decision = classifier.coef * jaundiceIndex + classifier.intercept;
  return decision >= 0 ? 1 : 0;
}

/**
 * The historical binary SVC is not validated for a three-way medical screen.
 * This mapping only supports local engineering evaluation and is not a diagnosis.
 */
export function mapLegacyClassForEvaluation(classId: number): ScreeningStatus {
  if (classId === 0) return "possible"; // source artifact class 0 = "Jaundice"
  if (classId === 1) return "clear"; // source artifact class 1 = "NO-Jaundice"
  return "inconclusive";
}
