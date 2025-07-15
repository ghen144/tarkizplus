FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy backend code
COPY src/backend/ .

# Copy data folder
COPY src/backend/data/ data/

# Install system-level build tools (needed by numpy, pandas, etc.)
RUN apt-get update && apt-get install -y build-essential && \
    pip install --upgrade pip && \
    pip install setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Run the FastAPI app
CMD ["uvicorn", "tarkiz_compass_api:app", "--host", "0.0.0.0", "--port", "10000"]
