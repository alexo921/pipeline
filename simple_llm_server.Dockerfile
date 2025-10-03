FROM python:3.10-slim

WORKDIR /app
COPY simple_llm_server.py .
RUN pip install flask

EXPOSE 1337
CMD ["python3", "simple_llm_server.py"]
