from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from helpbot_core import HelpBot

# === FastAPI Setup ===
app = FastAPI()

# Optional: CORS for browser support
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",                      # for local dev
        "https://tarkizplus.onrender.com",            # your deployed frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# === Pydantic model ===
class Query(BaseModel):
    question: str

bot = HelpBot()

# === Main route ===
@app.post("/ask")
async def ask_question(data: Query):
    try:
        answer = bot.ask(data.question)
        return {"answer": answer}
    except Exception as e:
        return {"answer": "Sorry, something went wrong.", "error": str(e)}

# === Optional: run directly ===
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("helpbot_api:app", host="127.0.0.1", port=8000, reload=True)
