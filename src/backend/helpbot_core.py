from PyPDF2 import PdfReader
from together import Together
import os

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # the 'backend/' folder
API_KEY = "a6386fd256a7a0d12c46d585791ed0f25a26db7511ef9ad51c40a884505fb240"
PDF_GUIDE_PATH = os.path.join(BASE_DIR,"data","QnA_Guide.pdf")
LLM_MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free"

def load_pdf_guide_text(pdf_path):
    reader = PdfReader(pdf_path)
    return "\n".join(page.extract_text() for page in reader.pages if page.extract_text())

class HelpBot:
    def __init__(self):
        self.pdf_text = load_pdf_guide_text(PDF_GUIDE_PATH)
        self.client = Together(api_key=API_KEY)

    def ask(self, question: str) -> str:
        messages = [
            {"role": "system", "content": (
                "You are a professional help assistant for the Tarkiz+ platform. "
                "Answer using only the information provided in the website guide below."
            )},
            {"role": "user", "content": f"{self.pdf_text}\n\nQuestion: {question}"}
        ]
        response = self.client.chat.completions.create(
            model=LLM_MODEL,
            messages=messages,
            max_tokens=512,
            temperature=0.2
        )
        return response.choices[0].message.content