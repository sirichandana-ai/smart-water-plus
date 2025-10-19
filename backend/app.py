from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import joblib
import os
import random


# Initialize Flask app
app = Flask(__name__)
CORS(app)

# ------------------------
# Load Models
# ------------------------
backend_dir = os.path.dirname(os.path.abspath(__file__))
models_dir = os.path.join(backend_dir, "models")

# Leak detection model
try:
    rf_model = joblib.load(os.path.join(models_dir, "leak_detector_rf.pkl"))
    lr_model = joblib.load(os.path.join(models_dir, "leak_detector_lr.pkl"))
    print("✅ Models loaded successfully!")
except Exception as e:
    rf_model, lr_model = None, None
    print(f"⚠️ Model loading failed: {e}")



# ------------------------
# Routes
# ------------------------

@app.route('/')
def home():
    return jsonify({"message": "Smart Water Leak Detection API is running!"})

# 1️⃣ Predict leak
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        pressure = float(data.get('pressure'))
        flow = float(data.get('flow'))
        temperature = float(data.get('temperature'))
        features = np.array([[pressure, flow, temperature]])

        if rf_model and lr_model:
            rf_pred = int(rf_model.predict(features)[0])
            lr_pred = int(lr_model.predict(features)[0])
            rf_prob = float(rf_model.predict_proba(features)[0][1])
            lr_prob = float(lr_model.predict_proba(features)[0][1])
        else:
            rf_pred, lr_pred = 0, 0
            rf_prob, lr_prob = random.uniform(0, 1), random.uniform(0, 1)

        return jsonify({
            "RandomForest_Prediction": rf_pred,
            "RandomForest_Leak_Probability": rf_prob,
            "LogisticRegression_Prediction": lr_pred,
            "LogisticRegression_Leak_Probability": lr_prob
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400

    
# 2️⃣ Forecast demand
@app.route('/forecast', methods=['POST'])
def forecast_demand():
    try:
        data = request.get_json()
        days = int(data.get('days', 7))
        avg_flow = float(data.get('avg_flow', 100))
        temperature = float(data.get('temperature', 25))

            # simple simulated model — could later be replaced with ARIMA/LSTM model
        forecast = []
        for d in range(1, days + 1):
            fluctuation = random.uniform(-5, 5)
            demand = round(avg_flow + (temperature * 0.2) + fluctuation, 2)
            forecast.append({"day": d, "predicted_demand_L": demand})

        return jsonify({
        "message": "Forecasted daily demand (liters)",
        "forecast": forecast
    })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    

# 3️⃣ Water allocation scheduler
@app.route('/schedule', methods=['POST'])
def schedule():
    try:
        data = request.get_json()
        total_water = float(data.get("total_water", 10000)) # total liters available
        houses = int(data.get("houses", 10))
        forecasted_demand = data.get("forecasted_demand", [])

        if forecasted_demand:
            total_demand = sum(forecasted_demand)
            allocation = [
            round((d / total_demand) * total_water, 2)
            for d in forecasted_demand
        ]
        else:
            allocation = [round(total_water / houses, 2) for _ in range(houses)]

        return jsonify({
        "total_water_available": total_water,
        "houses": houses,
        "allocation_L_per_house": allocation
    })
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# 4️⃣ Simulate sensor data
@app.route('/simulate-data', methods=['GET'])
def simulate_data():
    data = {
        "pressure": round(random.uniform(5, 15), 2),
        "flow": round(random.uniform(0, 10), 2),
        "tank_level": round(random.uniform(50, 100), 2)
    }
    return jsonify(data)

# ------------------------
# Run app
# ------------------------
if __name__ == '__main__':
    app.run(debug=True)
