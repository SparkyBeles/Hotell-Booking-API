FROM node:22 

WORKDIR /app


RUN npm install -g serverless


COPY package*.json ./

RUN npm ci

COPY . .



