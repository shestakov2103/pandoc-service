FROM node:lts-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:lts-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    pandoc \
    fontconfig \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/templates ./templates

EXPOSE ${PORT:-3000}

CMD ["node", "dist/main.js"]
