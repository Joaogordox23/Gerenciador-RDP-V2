FROM node:18-alpine

WORKDIR /app

# Instala dependências
COPY package.json ./
RUN npm install --production

# Copia o servidor
COPY server.js ./

# Expõe porta WebSocket
EXPOSE 8080

# Inicia o servidor
CMD ["node", "server.js"]
