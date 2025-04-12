FROM node:18

WORKDIR /app

# copy and install dependencies
COPY ./react-app/package*.json ./
RUN npm install

# copy all other files
COPY ./react-app .

CMD ["npm", "run", "start"]