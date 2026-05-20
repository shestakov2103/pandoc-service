FROM node:lts-slim AS build

RUN corepack enable

WORKDIR /app

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY . ./

RUN pnpm run build

FROM node:lts-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    pandoc \
    fontconfig \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN corepack enable

COPY pnpm-lock.yaml package.json ./

RUN pnpm install --prod --frozen-lockfile

COPY --from=build /app/dist ./dist
COPY --from=build /app/templates ./templates

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/main.js"]
