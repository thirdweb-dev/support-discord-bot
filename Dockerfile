FROM node:18-alpine

# Upgrade packages
RUN apk update && apk upgrade

WORKDIR /app

COPY . .

RUN yarn

CMD yarn start
