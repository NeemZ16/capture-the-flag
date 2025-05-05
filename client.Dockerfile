FROM node:18

WORKDIR /app

# copy and install dependencies
COPY ./client/package*.json ./
RUN npm install

# install serve globally
RUN npm install -g serve

# copy all other files
COPY ./client .

# Accept build arguments
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_WS_URL
ENV VITE_WS_URL=$VITE_WS_URL

# build the app
RUN npm run build

# set the command to serve the production build
CMD ["serve", "-s", "dist", "-l", "8080"]