FROM python:3.12

WORKDIR /app

# copy and install dependencies
COPY ./flask-server/requirements.txt requirements.txt
RUN pip install -r requirements.txt

# copy source files
COPY ./flask-server .

# wait for db
## Add the wait script to the image
COPY --from=ghcr.io/ufoscout/docker-compose-wait:latest /wait /wait

CMD /wait && python3 -u app.py
