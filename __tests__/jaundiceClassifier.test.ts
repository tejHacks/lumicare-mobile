import { mapLegacyClassForEvaluation, predictLegacyJaundiceClass } from "../src/services/ml/jaundice_classifier";
import { analyzeEyeImage } from "../src/services/ml/jaundice_screening";

const mockAnalyzeEyeImageOnDevice = jest.fn();

describe("ONNX scan path", () => {
  it("always delegates scans to on-device inference without a demo fallback", async () => {
    const modelResult = {
      status: "possible" as const,
      source: "on-device-model" as const,
      evaluationOnly: true as const,
    };
    mockAnalyzeEyeImageOnDevice.mockResolvedValue(modelResult);

    await expect(analyzeEyeImage("file:///eye.jpg", async () => ({
      analyzeEyeImageOnDevice: mockAnalyzeEyeImageOnDevice,
    }))).resolves.toEqual(modelResult);
    expect(mockAnalyzeEyeImageOnDevice).toHaveBeenCalledWith("file:///eye.jpg");
  });
});

describe("ported legacy SVC classifier", () => {
  it("matches the source model's class on representative values", () => {
    expect(predictLegacyJaundiceClass(0)).toBe(1);
    expect(predictLegacyJaundiceClass(0.1)).toBe(1);
    expect(predictLegacyJaundiceClass(0.15920801792366115)).toBe(1);
    expect(predictLegacyJaundiceClass(0.2)).toBe(0);
    expect(predictLegacyJaundiceClass(1)).toBe(0);
  });

  it("keeps the binary source labels explicitly provisional in the three-way UI", () => {
    expect(mapLegacyClassForEvaluation(0)).toBe("possible");
    expect(mapLegacyClassForEvaluation(1)).toBe("clear");
    expect(mapLegacyClassForEvaluation(2)).toBe("inconclusive");
  });

  it("rejects invalid feature values instead of classifying them silently", () => {
    expect(() => predictLegacyJaundiceClass(Number.NaN)).toThrow(RangeError);
    expect(() => predictLegacyJaundiceClass(-0.01)).toThrow(RangeError);
    expect(() => predictLegacyJaundiceClass(1.01)).toThrow(RangeError);
  });
});