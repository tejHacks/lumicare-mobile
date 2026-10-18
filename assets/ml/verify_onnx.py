"""Compare original PyTorch and exported ONNX segmentation results on local images."""

from pathlib import Path

import numpy as np
from ultralytics import YOLO

ROOT = Path(__file__).resolve().parents[2]
PT = YOLO(str(ROOT / "files" / "sclera_detector.pt"))
ONNX = YOLO(str(Path(__file__).resolve().parent / "sclera_detector.onnx"))
SAMPLES = sorted((ROOT / "assets").glob("IMG-*.jpg")) + [
    ROOT / "assets" / "baby.jpeg",
    ROOT / "assets" / "eyes.jpeg",
]

for path in SAMPLES:
    pt = PT.predict(str(path), conf=0.6, imgsz=640, retina_masks=True, verbose=False)[0]
    onnx = ONNX.predict(str(path), conf=0.6, imgsz=640, retina_masks=True, verbose=False)[0]
    if len(pt.boxes) != len(onnx.boxes):
        raise AssertionError(f"{path.name}: detection count differs ({len(pt.boxes)} != {len(onnx.boxes)})")
    if not np.array_equal(pt.boxes.cls.cpu().numpy(), onnx.boxes.cls.cpu().numpy()):
        raise AssertionError(f"{path.name}: class IDs differ")

    box_delta = None
    conf_delta = None
    mask_iou = None
    if len(pt.boxes):
        box_delta = float(np.max(np.abs(pt.boxes.xyxy.cpu().numpy() - onnx.boxes.xyxy.cpu().numpy())))
        conf_delta = float(np.max(np.abs(pt.boxes.conf.cpu().numpy() - onnx.boxes.conf.cpu().numpy())))
    if pt.masks is not None and onnx.masks is not None:
        pt_mask = pt.masks.data.cpu().numpy() > 0
        onnx_mask = onnx.masks.data.cpu().numpy() > 0
        intersection = np.logical_and(pt_mask, onnx_mask).sum()
        union = np.logical_or(pt_mask, onnx_mask).sum()
        mask_iou = float(intersection / max(1, union))

    print(
        f"{path.name}: detections={len(pt.boxes)}, box_max_abs_delta={box_delta}, "
        f"confidence_max_abs_delta={conf_delta}, aggregate_mask_iou={mask_iou}"
    )
