FROM python:3.12

WORKDIR /app

# copy and install dependencies
COPY ./flask-server/requirements.txt requirements.txt
RUN pip install -r requirements.txt

# copy source files
COPY ./flask-server .

# wait for db
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.2.1/wait /wait
RUN chmod +x /wait

CMD /wait && python3 -u app.py
