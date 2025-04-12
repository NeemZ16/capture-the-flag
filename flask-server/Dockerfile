FROM python:3.12

WORKDIR /app

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

COPY ./util ./util
COPY ./.env ./.env
COPY ./app.py ./app.py

# wait for db
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.2.1/wait /wait
RUN chmod +x /wait

CMD ["/wait", "--", "python", "app.py"]
