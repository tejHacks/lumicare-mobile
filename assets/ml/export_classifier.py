"""Convert the project's one-feature linear SVC into plain JSON coefficients."""

from __future__ import annotations

import json
import warnings
from pathlib import Path

import joblib

ROOT = Path(__file__).resolve().parents[2]
OUTPUT_DIR = Path(__file__).resolve().parent
MODEL_PATH = ROOT / "files" / "jaundice_predicter.pkl"
OUTPUT_PATH = OUTPUT_DIR / "jaundice_classifier.json"


def main() -> None:
    # This loads a trusted, checked-in model. Never load user-supplied pickle files.
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")
        model = joblib.load(MODEL_PATH)

    if getattr(model, "kernel", None) != "linear" or model.coef_.shape != (1, 1):
        raise ValueError("Expected a binary linear SVC with one jaundice-index feature")
    classes = [int(value) for value in model.classes_]
    if classes != [0, 1]:
        raise ValueError(f"Unexpected SVC classes: {classes}")

    coef = float(model.coef_[0, 0])
    intercept = float(model.intercept_[0])
    threshold = -intercept / coef
    converted = {
        "source": MODEL_PATH.relative_to(ROOT).as_posix(),
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

    for score in [0.0, threshold - 1e-5, threshold, threshold + 1e-5, 1.0]:
        expected = int(model.predict([[score]])[0])
        actual = 1 if coef * score + intercept >= 0 else 0
        if actual != expected:
            raise ValueError(f"Converted SVC mismatches at {score}: got {actual}, expected {expected}")

    OUTPUT_PATH.write_text(json.dumps(converted, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(converted, indent=2))


if __name__ == "__main__":
    main()
