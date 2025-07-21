import os
import pickle
import numpy as np
import pandas as pd
import chardet
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
INDEX_BASE_DIR = os.path.join(BASE_DIR, "csv_rag_index")
MODEL_PATH = os.path.join(BASE_DIR, "data", "teacher_matching_model.pkl")
LESSON_MODEL_PATH = os.path.join(BASE_DIR, "data", "lesson_recommendation_model.pkl")
EMB_MODEL = "togethercomputer/m2-bert-80M-32k-retrieval"
LLM_MODEL = "mistralai/Mixtral-8x7B-Instruct-v0.1"
TOP_K = 50
SIM_THRESHOLD = 0.2

client = Together(api_key=API_KEY)

chat_histories = {
    "admin": [],
    "teacher": [],
    "unknown": []
}
def detect_encoding(file_path):
    with open(file_path, 'rb') as f:
        result = chardet.detect(f.read(10000))
    return result['encoding']

def build_all_indexes():
    client = Together(api_key=API_KEY)
    for name, path in CSV_FILES.items():
        index_dir = os.path.join(INDEX_BASE_DIR, name)
        os.makedirs(index_dir, exist_ok=True)
        encoding = detect_encoding(path)
        df = pd.read_csv(path, encoding=encoding)
        texts = df.astype(str).agg(" ".join, axis=1).tolist()
        resp = client.embeddings.create(model=EMB_MODEL, input=texts)
        embeddings = np.vstack([d.embedding for d in resp.data])
        np.save(os.path.join(index_dir, "embeddings.npy"), embeddings)
        with open(os.path.join(index_dir, "row_texts.pkl"), "wb") as f:
            pickle.dump(texts, f)
        df.to_pickle(os.path.join(index_dir, "dataframe.pkl"))

def extract_ids(query):
    return [w.upper() for w in query.split() if (w.lower().startswith("t0") or w.lower().startswith("s0")) and len(w) >= 4]


# def load_pdf_guide_text(pdf_path):
#     reader = PdfReader(pdf_path)
#     return "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])



def handle_query(query, role=None):
    if role not in chat_histories:
        role = "unknown"

    chat_history = chat_histories[role]

    # Ensure indexes are built
    for name in CSV_FILES:
        idx_file = os.path.join(INDEX_BASE_DIR, name, "embeddings.npy")
        if not os.path.exists(idx_file):
            build_all_indexes()

    client = Together(api_key=API_KEY)

    # Load dataframes
    dataframes = {
        name: pd.read_pickle(os.path.join(INDEX_BASE_DIR, name, "dataframe.pkl"))
        for name in CSV_FILES
    }
    students_df = dataframes["Students"]
    teachers_df = dataframes["Teachers"]
    lessons_df = dataframes["Lessons"]
    teacher_model = joblib.load(MODEL_PATH) if os.path.exists(MODEL_PATH) else None

    # Match teacher command
    if query.lower().startswith("match teacher for"):
        if teacher_model is None:
            return "🔍 No model found. Please train it first."
        student_id = query.split()[-1].upper()
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

    # General CSV exploration
    query_ids = extract_ids(query)
    contexts = []

    for name, df in dataframes.items():
        mask = df.apply(lambda col: col.astype(str).str.contains('|'.join(query_ids), case=False), axis=0).any(axis=1)
        if mask.any():
            snippet = df[mask].to_csv(index=False, lineterminator='\n')
            contexts.append(f"🔹 From {name} table:\n{snippet}")

    if not contexts:
        qresp = client.embeddings.create(model=EMB_MODEL, input=[query]).data[0]
        qvec = np.array(qresp.embedding).reshape(1, -1)
        for name in CSV_FILES:
            index_dir = os.path.join(INDEX_BASE_DIR, name)
            embeddings = np.load(os.path.join(index_dir, "embeddings.npy"))
            df = pd.read_pickle(os.path.join(index_dir, "dataframe.pkl"))
            sims = cosine_similarity(qvec, embeddings)[0]
            top_idx = sims.argsort()[-TOP_K:][::-1]
            if sims[top_idx[0]] > SIM_THRESHOLD:
                snippet = df.iloc[top_idx].to_csv(index=False, lineterminator='\n')
                contexts.append(f"🔹 From {name} table:\n{snippet}")

    if not contexts:
        memory = "\n".join(f"{m['role'].capitalize()}: {m['content']}" for m in chat_history[-10:])
        contexts.append(f"No relevant data found in CSV files.\nRecent conversation:\n{memory}")

    context = "\n\n".join(contexts) + f"\n\nPlease answer based only on the above. Question: {query}"

    messages = [
        {"role": "system", "content": (
            "You are Tarkiz Compass, an authoritative educational recommendation assistant for Tarkiz+ platform. "
            "Always ground your answers exclusively in the provided CSV data. "
            "Do not infer, guess, or hallucinate—avoid any assumptions about missing information. "
            "Keep your responses concise, factual, and directly on point. "
            "keep your answers short unless asked otherwise"
            "Only explain your reasoning when explicitly asked to do so. "
            "When asked to analyze or predict, adopt the role of an expert educator and base every insight solely on the CSV context."
        )},
        *chat_history,
        {"role": "user", "content": context}
    ]

    resp = client.chat.completions.create(
        model=LLM_MODEL,
        messages=messages,
        max_tokens=512,
        temperature=0.2
    )
    answer = resp.choices[0].message.content

    chat_history.extend([
        {"role": "user", "content": query},
        {"role": "assistant", "content": answer}
    ])
    chat_histories[role] = chat_history[-20:]

    return answer


if __name__ == "__main__":
    print("Welcome to the CSV Data Exploration Chatbot! 🤖")
    print("Ask questions about Students, Teachers, Lessons.")
    print("Use 'match teacher for SXXX' to find the best teacher match.")
    print("Type 'exit' or 'quit' to stop.")

    while True:
        user_input = input("You: ").strip()
        if user_input.lower() in ("exit", "quit"):
            print("👋 Goodbye!")
            break
        response = handle_query(user_input)
        print("Bot:", response)

