# Use official Python image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Copy all files into container
COPY . .

# Install dependencies using requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Expose port for Hugging Face (or general use)
EXPOSE 7860

# Start app using Gunicorn
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:7860", "app:app"]
