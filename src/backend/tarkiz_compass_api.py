from fastapi import FastAPI
from pydantic import BaseModel
from tarkiz_compass_core import handle_query
from starlette.middleware.cors import CORSMiddleware
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://tarkizplus.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class Query(BaseModel):
    text: str
    session_id: str

@app.post("/query")
def process_query(query: Query):
    # print("Got query:", query.text)
    # answer =
    # return {"answer": answer}
    try:

        answer = handle_query(query.text, query.session_id)
        return {"answer": answer}
    except Exception as e:
        print("BACKEND ERROR:", str(e))
        return {"answer": "Sorry, something went wrong.", "error": str(e)}