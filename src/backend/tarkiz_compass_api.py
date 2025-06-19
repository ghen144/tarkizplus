from fastapi import FastAPI
from pydantic import BaseModel
from tarkiz_compass_core import handle_query  # make sure this matches your filename
from starlette.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class Query(BaseModel):
    text: str

@app.post("/query")
def process_query(query: Query):
    print("🚀 Got query:", query.text)
    answer = handle_query(query.text)
    return {"answer": answer}