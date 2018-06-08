FROM node:jessie

WORKDIR /app

ADD . /app

RUN npm install

EXPOSE 8080

CMD ["npm", "start"]