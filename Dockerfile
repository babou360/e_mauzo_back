FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Copy Firebase credentials
COPY service_account.json ./service_account.json

EXPOSE 5000

CMD ["npm", "start"]
