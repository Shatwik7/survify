# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./


COPY . .

RUN npm install
RUN npm run build server

# Stage 2: Production
FROM node:24-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist/apps/server ./dist
COPY package*.json ./

ENV NODE_ENV=Production

CMD ["node", "dist/main"]
