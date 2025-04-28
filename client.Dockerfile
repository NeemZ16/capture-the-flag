FROM node:18

WORKDIR /app

# copy and install dependencies
COPY ./react-app/package*.json ./
RUN npm install

# install serve globally
RUN npm install -g serve

# copy all other files
COPY ./react-app .

# Accept build argument
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# build the app
RUN npm run build

# set the command to serve the production build
CMD ["serve", "-s", "build", "-l", "8080"]