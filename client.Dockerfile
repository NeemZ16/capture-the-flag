FROM node:18

WORKDIR /app

# copy and install dependencies
COPY ./react-app/package*.json ./
RUN npm install

# install serve globally
RUN npm install -g serve

# copy all other files
COPY ./react-app .

# CMD ["npm", "run", "start"]

# build the app
RUN npm run build

# set the command to serve the production build
CMD ["serve", "-s", "build", "-l", "8080"]