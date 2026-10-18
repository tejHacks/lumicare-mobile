import { File, Paths } from "expo-file-system";
import jpeg from "jpeg-js";
import { InferenceSession, Tensor } from "onnxruntime-react-native";
import { Platform } from "react-native";

import { mapLegacyClassForEvaluation, predictLegacyJaundiceClass } from "./jaundice_classifier";
import type { ScreeningResult } from "./jaundice_screening";

const SIDE = 640;
const PROTO_SIDE = 160;
const PROTO_CHANNELS = 32;
const SCLERA_CLASS = 1;
const DETECTION_CONFIDENCE = 0.6;

let sessionPromise: Promise<InferenceSession> | undefined;

type RgbaImage = { data: Uint8Array; width: number; height: number };

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function createLetterboxedTensor(image: RgbaImage) {
  const scale = Math.min(SIDE / image.width, SIDE / image.height);
  const resizedWidth = Math.round(image.width * scale);
  const resizedHeight = Math.round(image.height * scale);
  const padLeft = Math.round((SIDE - resizedWidth) / 2 - 0.1);
  const padTop = Math.round((SIDE - resizedHeight) / 2 - 0.1);
  const canvas = new Uint8Array(SIDE * SIDE * 3);
  canvas.fill(114);

  for (let y = 0; y < resizedHeight; y += 1) {
    const sourceY = clamp((y + 0.5) * image.height / resizedHeight - 0.5, 0, image.height - 1);
    const y0 = Math.floor(sourceY);
    const y1 = Math.min(y0 + 1, image.height - 1);
    const fy = sourceY - y0;
    for (let x = 0; x < resizedWidth; x += 1) {
      const sourceX = clamp((x + 0.5) * image.width / resizedWidth - 0.5, 0, image.width - 1);
      const x0 = Math.floor(sourceX);
      const x1 = Math.min(x0 + 1, image.width - 1);
      const fx = sourceX - x0;
      const dest = ((y + padTop) * SIDE + x + padLeft) * 3;
      const p00 = (y0 * image.width + x0) * 4;
      const p01 = (y0 * image.width + x1) * 4;
      const p10 = (y1 * image.width + x0) * 4;
      const p11 = (y1 * image.width + x1) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        const top = image.data[p00 + channel] * (1 - fx) + image.data[p01 + channel] * fx;
        const bottom = image.data[p10 + channel] * (1 - fx) + image.data[p11 + channel] * fx;
        canvas[dest + channel] = Math.round(top * (1 - fy) + bottom * fy);
      }
    }
  }

  const chw = new Float32Array(3 * SIDE * SIDE);
  const planeSize = SIDE * SIDE;
  for (let pixel = 0; pixel < planeSize; pixel += 1) {
    chw[pixel] = canvas[pixel * 3] / 255;
    chw[planeSize + pixel] = canvas[pixel * 3 + 1] / 255;
    chw[2 * planeSize + pixel] = canvas[pixel * 3 + 2] / 255;
  }

  return {
    canvas,
    tensor: new Tensor("float32", chw, [1, 3, SIDE, SIDE]),
    scale,
    padLeft,
    padTop,
    resizedWidth,
    resizedHeight,
  };
}

function buildScleraMask(detections: Float32Array, prototypes: Float32Array) {
  const union = new Uint8Array(SIDE * SIDE);
  const protoPlane = PROTO_SIDE * PROTO_SIDE;
  let foundSclera = false;

  for (let detection = 0; detection < 300; detection += 1) {
    const offset = detection * 38;
    const score = detections[offset + 4];
    const classId = Math.round(detections[offset + 5]);
    if (score < DETECTION_CONFIDENCE || classId !== SCLERA_CLASS) continue;

    const boxX1 = detections[offset];
    const boxY1 = detections[offset + 1];
    const x2 = detections[offset + 2];
    const y2 = detections[offset + 3];
    if (![boxX1, boxY1, x2, y2].every(Number.isFinite) || x2 <= boxX1 || y2 <= boxY1) continue;
    const coeffOffset = offset + 6;
    const protoMask = new Float32Array(protoPlane);

    for (let pixel = 0; pixel < protoPlane; pixel += 1) {
      let value = 0;
      for (let channel = 0; channel < PROTO_CHANNELS; channel += 1) {
        value += detections[coeffOffset + channel] * prototypes[channel * protoPlane + pixel];
      }
      protoMask[pixel] = 1 / (1 + Math.exp(-value));
    }

    // Upsample only inside the detection box. Expanding every prototype mask
    // over all 640x640 pixels blocked the JS thread on mid-range phones.
    const startY = clamp(Math.floor(boxY1), 0, SIDE);
    const endY = clamp(Math.ceil(y2), 0, SIDE);
    const startX = clamp(Math.floor(boxX1), 0, SIDE);
    const endX = clamp(Math.ceil(x2), 0, SIDE);
    if (startX >= endX || startY >= endY) continue;

    for (let y = startY; y < endY; y += 1) {
      const sourceY = clamp((y + 0.5) * PROTO_SIDE / SIDE - 0.5, 0, PROTO_SIDE - 1);
      const y0 = Math.floor(sourceY);
      const y1 = Math.min(y0 + 1, PROTO_SIDE - 1);
      const fy = sourceY - y0;
      for (let x = startX; x < endX; x += 1) {
        const sourceX = clamp((x + 0.5) * PROTO_SIDE / SIDE - 0.5, 0, PROTO_SIDE - 1);
        const x0 = Math.floor(sourceX);
        const x1 = Math.min(x0 + 1, PROTO_SIDE - 1);
        const fx = sourceX - x0;
        const top = protoMask[y0 * PROTO_SIDE + x0] * (1 - fx) + protoMask[y0 * PROTO_SIDE + x1] * fx;
        const bottom = protoMask[y1 * PROTO_SIDE + x0] * (1 - fx) + protoMask[y1 * PROTO_SIDE + x1] * fx;
        if (x >= boxX1 && x < x2 && y >= boxY1 && y < y2 && top * (1 - fy) + bottom * fy > 0.5) {
          union[y * SIDE + x] = 1;
        }
      }
    }
    foundSclera = true;
  }
  return foundSclera ? union : null;
}

function otsuThreshold(histogram: Uint32Array, total: number, sumTotal: number) {
  let backgroundWeight = 0;
  let backgroundSum = 0;
  let bestVariance = -1;
  let threshold = 0;
  for (let level = 0; level < 256; level += 1) {
    backgroundWeight += histogram[level];
    if (!backgroundWeight) continue;
    const foregroundWeight = total - backgroundWeight;
    if (!foregroundWeight) break;
    backgroundSum += level * histogram[level];
    const meanBackground = backgroundSum / backgroundWeight;
    const meanForeground = (sumTotal - backgroundSum) / foregroundWeight;
    const variance = backgroundWeight * foregroundWeight * (meanBackground - meanForeground) ** 2;
    if (variance > bestVariance) {
      bestVariance = variance;
      threshold = level;
    }
  }
  return threshold;
}

function calculateJaundiceIndex(
  canvas: Uint8Array,
  scleraMask: Uint8Array,
  geometry: { padLeft: number; padTop: number; resizedWidth: number; resizedHeight: number },
) {
  const gray = new Uint8Array(SIDE * SIDE);
  const histogram = new Uint32Array(256);
  let total = 0;
  let sumTotal = 0;

  for (let y = geometry.padTop; y < geometry.padTop + geometry.resizedHeight; y += 1) {
    for (let x = geometry.padLeft; x < geometry.padLeft + geometry.resizedWidth; x += 1) {
      const pixel = y * SIDE + x;
      const rgb = pixel * 3;
      const value = scleraMask[pixel]
        ? Math.round(0.299 * canvas[rgb] + 0.587 * canvas[rgb + 1] + 0.114 * canvas[rgb + 2])
        : 0;
      gray[pixel] = value;
      histogram[value] += 1;
      total += 1;
      sumTotal += value;
    }
  }
  if (!total) return null;

  const threshold = otsuThreshold(histogram, total, sumTotal);
  let yellowPixels = 0;
  let nonzeroScleraChannels = 0;
  for (let y = geometry.padTop; y < geometry.padTop + geometry.resizedHeight; y += 1) {
    for (let x = geometry.padLeft; x < geometry.padLeft + geometry.resizedWidth; x += 1) {
      const pixel = y * SIDE + x;
      if (gray[pixel] <= threshold) continue;
      const rgb = pixel * 3;
      const red = canvas[rgb];
      const green = canvas[rgb + 1];
      const blue = canvas[rgb + 2];
      nonzeroScleraChannels += Number(red > 0) + Number(green > 0) + Number(blue > 0);

      const max = Math.max(red, green, blue);
      const min = Math.min(red, green, blue);
      const delta = max - min;
      let hue = 0;
      if (delta !== 0) {
        if (max === red) hue = 60 * (((green - blue) / delta) % 6);
        else if (max === green) hue = 60 * ((blue - red) / delta + 2);
        else hue = 60 * ((red - green) / delta + 4);
        if (hue < 0) hue += 360;
      }
      const hueOpenCv = Math.round(hue / 2);
      const saturation = max === 0 ? 0 : Math.round(delta * 255 / max);
      if (hueOpenCv >= 10 && hueOpenCv <= 40 && saturation >= 20 && max >= 20) yellowPixels += 1;
    }
  }
  if (nonzeroScleraChannels === 0) return null;
  return yellowPixels / nonzeroScleraChannels;
}

async function getSession() {
  if (Platform.OS === "web") throw new Error("The on-device ONNX model is supported on Android/iOS builds only.");
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const bundledModel = new File(Paths.bundle, "sclera_detector.onnx");
      if (!bundledModel.exists) throw new Error("The bundled sclera model is missing. Rebuild the native development client.");
      const cachedModel = new File(Paths.cache, "lumicare-sclera-detector.onnx");
      await bundledModel.copy(cachedModel, { overwrite: true });
      return InferenceSession.create(cachedModel.uri, {
        executionProviders: ["cpu"],
        graphOptimizationLevel: "all",
        intraOpNumThreads: 2,
      });
    })().catch((error) => {
      sessionPromise = undefined;
      throw error;
    });
  }
  return sessionPromise;
}

export async function analyzeEyeImageOnDevice(imageUri: string): Promise<ScreeningResult> {
  const startedAt = Date.now();
  const trace = (step: string) => {
    if (__DEV__) console.info(`[LumiCare scan] ${step} (${Date.now() - startedAt} ms)`);
  };
  const imageFile = new File(imageUri);
  if (!imageFile.exists) throw new Error("The saved screening image is missing.");
  const decoded = jpeg.decode(await imageFile.bytes(), { useTArray: true });
  if (!decoded.width || !decoded.height) throw new Error("Could not decode the screening photo.");
  trace(`JPEG decoded ${decoded.width}x${decoded.height}`);

  const image: RgbaImage = { data: decoded.data, width: decoded.width, height: decoded.height };
  const input = createLetterboxedTensor(image);
  trace("Input tensor prepared");
  const session = await getSession();
  trace("ONNX session ready");
  const result = await session.run({ images: input.tensor });
  trace("ONNX inference complete");
  const detections = result.output0?.data;
  const prototypes = result.output1?.data;
  if (!(detections instanceof Float32Array) || !(prototypes instanceof Float32Array)) {
    throw new Error("The bundled model returned an unexpected tensor format.");
  }

  const scleraMask = buildScleraMask(detections, prototypes);
  trace(`Sclera mask ${scleraMask ? "built" : "not detected"}`);
  if (!scleraMask) return { status: "inconclusive", source: "on-device-model", evaluationOnly: true };

  const jaundiceIndex = calculateJaundiceIndex(input.canvas, scleraMask, input);
  trace("Image index calculated");
  if (jaundiceIndex === null || !Number.isFinite(jaundiceIndex)) {
    return { status: "inconclusive", source: "on-device-model", evaluationOnly: true };
  }

  const classId = predictLegacyJaundiceClass(jaundiceIndex);
  // The legacy sklearn class 0 is labelled "Jaundice" and class 1 "NO-Jaundice".
  // The mobile UI mapping is provisional; mark all such results as evaluation-only.
  return { status: mapLegacyClassForEvaluation(classId), source: "on-device-model", evaluationOnly: true };
}
