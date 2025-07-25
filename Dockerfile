FROM node:21

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8081

CMD ["npm", "start"]
