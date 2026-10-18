"""Export LumiCare's supplied YOLOv8-seg checkpoint for ONNX Runtime Mobile.

Run with a Python environment containing the versions listed in requirements-export.txt:
    python assets/ml/export_models.py
"""

from __future__ import annotations

import json
import shutil
import argparse
import warnings
import tempfile
from pathlib import Path

import onnx
import onnxruntime as ort
from ultralytics import YOLO

ROOT = Path(__file__).resolve().parents[2]
OUTPUT_DIR = Path(__file__).resolve().parent
SOURCE_YOLO = ROOT / "files" / "sclera_detector.pt"
SOURCE_CLASSIFIER = ROOT / "files" / "jaundice_predicter.pkl"
OUTPUT_ONNX = OUTPUT_DIR / "sclera_detector.onnx"
OUTPUT_CLASSIFIER = OUTPUT_DIR / "jaundice_classifier.json"
IMAGE_SIZE = 640


def export_yolo() -> dict[str, object]:
    if not SOURCE_YOLO.is_file():
        raise FileNotFoundError(f"YOLO checkpoint not found: {SOURCE_YOLO}")

    temporary_directory = tempfile.TemporaryDirectory(prefix="lumicare-yolo-export-")
    temporary_checkpoint = Path(temporary_directory.name) / SOURCE_YOLO.name
    shutil.copy2(SOURCE_YOLO, temporary_checkpoint)
    model = YOLO(str(temporary_checkpoint))
    if model.task != "segment":
        raise ValueError(f"Expected a segmentation model, got task={model.task!r}")
    if "sclera" not in model.names.values():
        raise ValueError(f"No 'sclera' class in checkpoint metadata: {model.names}")

    try:
        exported_path = Path(
            model.export(
                format="onnx",
                imgsz=IMAGE_SIZE,
                batch=1,
                dynamic=False,
                simplify=False,
                opset=17,
                nms=True,
                device="cpu",
            )
        )
        shutil.copy2(exported_path, OUTPUT_ONNX)
    finally:
        temporary_directory.cleanup()

    graph = onnx.load(str(OUTPUT_ONNX))
    onnx.checker.check_model(graph)
    session = ort.InferenceSession(str(OUTPUT_ONNX), providers=["CPUExecutionProvider"])
    inputs = session.get_inputs()
    outputs = session.get_outputs()
    if len(inputs) != 1 or inputs[0].shape != [1, 3, IMAGE_SIZE, IMAGE_SIZE]:
        raise ValueError(f"Unexpected ONNX input contract: {[item.shape for item in inputs]}")
    if len(outputs) != 2:
        raise ValueError(f"Expected YOLO NMS detections + mask prototypes, got {len(outputs)} outputs")

    return {
        "source": SOURCE_YOLO.relative_to(ROOT).as_posix(),
        "file": OUTPUT_ONNX.name,
        "task": model.task,
        "classNames": {str(index): name for index, name in model.names.items()},
        "imageSize": IMAGE_SIZE,
        "input": {"name": inputs[0].name, "shape": inputs[0].shape, "type": inputs[0].type},
        "outputs": [
            {"name": item.name, "shape": item.shape, "type": item.type}
            for item in outputs
        ],
        "nmsEmbedded": True,
        "onnxOpset": 17,
    }


def export_linear_classifier() -> dict[str, object]:
    import joblib

    if not SOURCE_CLASSIFIER.is_file():
        raise FileNotFoundError(f"Classifier not found: {SOURCE_CLASSIFIER}")

    # Pickle/joblib can execute code. Only load the checked-in project artifact.
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")
        classifier = joblib.load(SOURCE_CLASSIFIER)

    if getattr(classifier, "kernel", None) != "linear" or classifier.coef_.shape != (1, 1):
        raise ValueError("Expected a binary linear SVC with one jaundice-index feature")
    classes = [int(item) for item in classifier.classes_]
    if classes != [0, 1]:
        raise ValueError(f"Unexpected SVC class ordering: {classes}")

    coef = float(classifier.coef_[0, 0])
    intercept = float(classifier.intercept_[0])
    threshold = -intercept / coef
    payload = {
        "source": SOURCE_CLASSIFIER.relative_to(ROOT).as_posix(),
        "estimator": "sklearn.svm.SVC",
        "kernel": "linear",
        "classes": classes,
        "coef": coef,
        "intercept": intercept,
        "decisionRule": "class 1 iff coef * jaundiceIndex + intercept >= 0; otherwise class 0",
        "positiveClassThreshold": threshold,
        "classLabels": {"0": "Jaundice", "1": "NO-Jaundice"},
        "feature": "jaundiceIndex",
        "featureRange": [0, 1],
    }

    # Guard against a faulty or version-incompatible conversion around the boundary.
    probes = [0.0, threshold - 1e-5, threshold, threshold + 1e-5, 1.0]
    for value in probes:
        expected = int(classifier.predict([[value]])[0])
        decision = coef * value + intercept
        converted = 1 if decision >= 0 else 0
        if converted != expected:
            raise ValueError(f"Converted classifier mismatch at {value}: {converted} != {expected}")

    OUTPUT_CLASSIFIER.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    return payload


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--yolo-only",
        action="store_true",
        help="Export and validate YOLO ONNX without requiring scikit-learn/joblib.",
    )
    args = parser.parse_args()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    yolo = export_yolo()
    classifier_payload = None
    if OUTPUT_CLASSIFIER.is_file():
        classifier_payload = json.loads(OUTPUT_CLASSIFIER.read_text(encoding="utf-8"))
    if args.yolo_only:
        manifest = {
            "formatVersion": 1,
            "status": "conversion-verified; mobile image parity still requires device validation",
            "yolo": yolo,
            "classifier": None if classifier_payload is None else {
                "file": OUTPUT_CLASSIFIER.name,
                "estimator": classifier_payload["estimator"],
                "positiveClassThreshold": classifier_payload["positiveClassThreshold"],
                "classLabels": classifier_payload["classLabels"],
            },
        }
        (OUTPUT_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(manifest, indent=2))
        return
    classifier_payload = export_linear_classifier()
    manifest = {
        "formatVersion": 1,
        "status": "conversion-verified; mobile image parity still requires device validation",
        "yolo": yolo,
        "classifier": {
            "file": OUTPUT_CLASSIFIER.name,
            "estimator": classifier_payload["estimator"],
            "positiveClassThreshold": classifier_payload["positiveClassThreshold"],
            "classLabels": classifier_payload["classLabels"],
        },
    }
    (OUTPUT_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
