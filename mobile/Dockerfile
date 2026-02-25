FROM node:20-bullseye

WORKDIR /app

# Reduce noise and ensure Expo CLI is available via npx
ENV npm_config_loglevel=warn

COPY package.json package-lock.json ./
RUN npm install && npm install -g @expo/ngrok

COPY . .

EXPOSE 19000 19001 19002 8081

CMD ["npm", "run", "start:docker"]
