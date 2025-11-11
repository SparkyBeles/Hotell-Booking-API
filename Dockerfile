FROM node:22 

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ENV NODE_ENV=production


CMD ["npx", "serverless", "deploy"]
