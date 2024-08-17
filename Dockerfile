# docker-compose build --no-cache
FROM node:22-alpine

# Install app dependencies
RUN apk add --no-cache \
    git \
    ;

# Install PM2 and auto pull for updates
RUN npm i pm2 -g
RUN pm2 install pm2-auto-pull

## Setup the bots folder
RUN mkdir -p /usr/src/bot
WORKDIR /usr/src/bot

# Copy and Install the bot dependencies
COPY ./package.json /usr/src/bot/package.json
RUN npm install --omit=dev

# NOTES:
# To re-build without cache:
# docker-compose build --no-cache