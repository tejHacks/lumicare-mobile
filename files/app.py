from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import cv2
import joblib
from ultralytics import YOLO
import traceback
import torch
from utils import *  # Make sure this is in your project
import datetime

app = Flask(__name__)
from flask_cors import CORS
# from flask_cors import CORS

# Allow localhost:5173 and all others for now
CORS(app,
     origins=["*"],
     allow_headers=["Content-Type"],
     expose_headers=["Content-Type"],
     supports_credentials=False)


# CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
 # Enable CORS for all routes

# === LOAD MODELS ===
try:
    print("🔄 Loading models...")
    detection_model = YOLO("sclera_detector.pt")
    prediction_model = joblib.load("jaundice_predicter.pkl")
    print("✅ Models loaded successfully!")
except Exception as e:
    print("❌ Error loading models:", traceback.format_exc())
    raise RuntimeError("Model loading failed")

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Jaundice Prediction API is live"})

@app.route("/predict", methods=["POST"])
def predict():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image provided."})

        file = request.files['image']
        
        # Check if file is empty
        if file.filename == '':
            return jsonify({"error": "No file selected."})
            
        contents = file.read()
        
        # Check if file content is empty
        if len(contents) == 0:
            return jsonify({"error": "Empty file uploaded."})
            
        npimg = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({"error": "Invalid image format. Please upload a valid image file."})

        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Measure inference time
        start_time = datetime.datetime.now()

        output = prediction_pipeline(img, detection_model, prediction_model)

        if output is None:
            return jsonify({"error": "No sclera detected in the image. Please upload a clear eye image."})
        
        _, sclera_image, yellow_mask, JI, label, y_pred = output

        total_time = (datetime.datetime.now() - start_time).total_seconds() * 1000  # in milliseconds

        # Speed breakdown as a readable string
        speed_breakdown = f"Sclera detection: fast, Mask processing: medium, Classification: instant"

        print(f"✅ Prediction successful - Label: {label}, JI: {JI}, y_pred: {y_pred[0]}")

        return jsonify({
            "prediction": int(y_pred[0]),
            "jaundice_index": float(JI),
            "label": label,
            "total_time_ms": round(total_time, 2),
            "speed": speed_breakdown
        })

    except Exception as e:
        error_details = traceback.format_exc()
        print("🔥 ERROR TRACEBACK:\n", error_details)
        return jsonify({
            "error": f"Processing failed: {str(e)}",
            "debug": error_details
        }), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=7860)