FROM node:8-alpine

RUN mkdir /APP

WORKDIR /APP

COPY . /APP

RUN rm -rf node_modules

RUN npm i --production

ENV NODE_ENV=production

EXPOSE 8080 8443

CMD ["node", "lib/index.js"]
