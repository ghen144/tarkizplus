FROM python:3.10-slim

WORKDIR /app

COPY src/backend/requirements.txt .
RUN apt-get update && apt-get install -y build-essential && \
    pip install --upgrade pip && \
    pip install setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

COPY src/backend/ .

CMD ["uvicorn", "tarkiz_compass_api:app", "--host", "0.0.0.0", "--port", "10000"]
