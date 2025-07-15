# Use Python 3.10 slim base image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy backend source code and data
COPY src/backend/ .

# Install build tools and dependencies
RUN apt-get update && apt-get install -y build-essential && \
    pip install --upgrade pip && \
    pip install setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Expose the port (optional for documentation)
EXPOSE ${PORT}

# Use env variable to run the correct API module
CMD ["sh", "-c", "uvicorn ${TARGET_API_MODULE}:app --host 0.0.0.0 --port ${PORT}"]
