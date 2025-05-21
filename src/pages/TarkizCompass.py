# ml-api/tarkiz_compass.py
from flask import Flask, request, jsonify
import pandas as pd
import joblib


app = Flask(__name__)
model = joblib.load("student_model.pkl")

def generate_compass_recommendation(student_data, question):
    # Your fancy AI logic here (example: rule-based + Mistral)
    prediction = model.predict([student_data])[0]
    return f"TarkizCompass recommends: {prediction}"

@app.route("/tarkiz-compass", methods=["POST"])
def compass():
    data = request.json
    student_data = get_student_data(data["student_id"])  # Fetch from Firebase
    reply = generate_compass_reply(student_data, data["question"])
    return jsonify({"reply": reply})

if __name__ == "__main__":
    app.run(port=5000)