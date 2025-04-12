FROM python:3.12

WORKDIR /app

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

COPY ./util ./util
COPY ./.env ./.env
COPY ./app.py ./app.py

CMD ["python", "app.py"]
