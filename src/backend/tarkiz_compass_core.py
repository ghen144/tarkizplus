import os
import pickle
import numpy as np
import pandas as pd
from PyPDF2 import PdfReader
from together import Together
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import LabelEncoder
import joblib
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # the 'backend/' folder
API_KEY = "a6386fd256a7a0d12c46d585791ed0f25a26db7511ef9ad51c40a884505fb240"
CSV_FILES = {
    "Students": os.path.join(BASE_DIR, "data", "Students.csv"),
    "Teachers": os.path.join(BASE_DIR, "data", "Teachers.csv"),
    "Lessons": os.path.join(BASE_DIR, "data", "Lessons.csv")
}
PDF_GUIDE_PATH = os.path.join(BASE_DIR, "data", "TarkizPlus –  Q&A Guide.pdf")
INDEX_BASE_DIR = os.path.join(BASE_DIR, "csv_rag_index")
MODEL_PATH = os.path.join(BASE_DIR, "data", "teacher_matching_model.pkl")
LESSON_MODEL_PATH = os.path.join(BASE_DIR, "data", "lesson_recommendation_model.pkl")
EMB_MODEL = "togethercomputer/m2-bert-80M-8k-retrieval"
LLM_MODEL = "mistralai/Mixtral-8x7B-Instruct-v0.1"
TOP_K = 50
SIM_THRESHOLD = 0.2

client = Together(api_key=API_KEY)
chat_history = []

def detect_encoding(file_path):
    import chardet
    with open(file_path, 'rb') as f:
        result = chardet.detect(f.read(10000))
    return result['encoding']

def build_all_indexes():
    for name, path in CSV_FILES.items():
        index_dir = os.path.join(INDEX_BASE_DIR, name)
        os.makedirs(index_dir, exist_ok=True)
        encoding = detect_encoding(path)
        df = pd.read_csv(path, encoding=encoding)
        row_texts = df.astype(str).agg(" ".join, axis=1).tolist()
        resp = client.embeddings.create(model=EMB_MODEL, input=row_texts)
        embeddings = np.vstack([d.embedding for d in resp.data])
        np.save(os.path.join(index_dir, "embeddings.npy"), embeddings)
        with open(os.path.join(index_dir, "row_texts.pkl"), "wb") as f:
            pickle.dump(row_texts, f)
        df.to_pickle(os.path.join(index_dir, "dataframe.pkl"))

def extract_ids(query):
    return [w.upper() for w in query.split() if (w.lower().startswith("t") or w.lower().startswith("s")) and len(w) >= 4]

def load_pdf_guide_text(pdf_path):
    reader = PdfReader(pdf_path)
    return "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])

def handle_query(query):
    if not os.path.exists(os.path.join(INDEX_BASE_DIR, "Students", "embeddings.npy")):
        build_all_indexes()

    dataframes = {name: pd.read_pickle(os.path.join(INDEX_BASE_DIR, name, "dataframe.pkl")) for name in CSV_FILES}
    students_df = dataframes["Students"]
    teachers_df = dataframes["Teachers"]
    lessons_df = dataframes["Lessons"]
    pdf_text = load_pdf_guide_text(PDF_GUIDE_PATH)

    teacher_model = joblib.load(MODEL_PATH) if os.path.exists(MODEL_PATH) else None
    lesson_model = joblib.load(LESSON_MODEL_PATH) if os.path.exists(LESSON_MODEL_PATH) else None

    if any(kw in query.lower() for kw in ["match teacher for", "recommend teacher for", "recommend a teacher for", "assign teacher for"]):
        if teacher_model is None:
            return "🔍 No model found. Please train it first."
        try:
            student_id = query.split()[-1].strip().upper()
            student_row = students_df[students_df["student_id"] == student_id]
            if student_row.empty:
                return f"❌ No student found with ID {student_id}"
            predictions = []
            for _, teacher_row in teachers_df.iterrows():
                for _, lesson_row in lessons_df.iterrows():
                    test_row = pd.DataFrame([{
                        "subject_x": lesson_row["subject"],
                        "grade": student_row["grade"].values[0],
                        "preferred_learning_style": student_row["preferred_learning_style"].values[0],
                        "engagement_level": student_row["engagement_level"].values[0],
                        "attendance_rate": student_row["attendance_rate"].values[0],
                        "duration_minutes": lesson_row["duration_minutes"],
                        "teacher_experience": student_row["teacher_experience"].values[0],
                        "experience_years": teacher_row["experience_years"]
                    }])
                    for col in test_row.select_dtypes(include="object").columns:
                        test_row[col] = LabelEncoder().fit_transform(test_row[col].astype(str))
                    score = teacher_model.predict(test_row)[0]
                    predictions.append((score, teacher_row["name"], teacher_row["email"]))
            best_score, best_name, best_email = max(predictions, key=lambda x: x[0])
            return f"🏅 Best match: {best_name} ({best_email}) with predicted score: {best_score:.2f}"
        except Exception as e:
            return f"⚠️ Error during prediction: {e}"

    elif "recommend" in query.lower() and "lesson" in query.lower():
        if lesson_model is None:
            return "⚠️ Lesson model not loaded. Please train it first."
        try:
            student_ids = extract_ids(query)
            if not student_ids:
                return "❌ No valid student ID found in query."
            student_id = student_ids[0]
            student = students_df[students_df["student_id"] == student_id]
            if student.empty:
                return f"❌ No student found with ID {student_id}"
            input_data = student[[
                "grade", "subject", "preferred_learning_style", "engagement_level",
                "attendance_rate", "recent_performance", "previous_lesson_difficulty"
            ]].copy()
            for col in input_data.select_dtypes(include="object").columns:
                input_data[col] = LabelEncoder().fit_transform(input_data[col].astype(str))
            prediction = lesson_model.predict(input_data)[0]
            label_map = {
                0: "🧩 Practice lesson",
                1: "🎮 Interactive session",
                2: "🤝 Support session",
                3: "🚀 Advanced lesson"
            }
            return f"📚 Suggested next lesson for {student_id}: {label_map.get(prediction, 'Unknown')}"
        except Exception as e:
            return f"⚠️ Error making lesson prediction: {e}"

    messages = [
        {"role": "system", "content": (
            "You are a professional help assistant for the Tarkiz+ platform. "
            "Answer using only the information provided in the website guide below. "
            "Be concise and clear."
        )},
        {"role": "user", "content": f"The following is the website guide:\n\n{pdf_text}\n\nQuestion: {query}"}
    ]
    chat_resp = client.chat.completions.create(
        model=LLM_MODEL,
        messages=messages,
        max_tokens=512,
        temperature=0.2
    )
    answer = chat_resp.choices[0].message.content
    chat_history.append({"role": "user", "content": query})
    chat_history.append({"role": "assistant", "content": answer})
    if len(chat_history) > 20:
        chat_history[:] = chat_history[-20:]
    return answer
