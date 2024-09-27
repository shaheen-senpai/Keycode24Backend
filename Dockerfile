FROM node:20.11-alpine3.18

WORKDIR /app

COPY . .

RUN npm install glob rimraf

RUN npm install

RUN npm run build

CMD ["npm", "run", "start:server"]