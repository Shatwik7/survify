# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Install CLI only for build step
RUN npm install -g @nestjs/cli

# Copy only what’s needed for dependency resolution
COPY package*.json ./
COPY tsconfig*.json nest-cli.json ./
COPY apps/ ./apps/
COPY libs/ ./libs/

# Install full deps to support ts-loader or webpack if needed
RUN npm install

# Build specific service
RUN npm run build population-service

# Stage 2: Runtime
FROM node:24-alpine AS runtime

WORKDIR /app

# Only copy minimal required files
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist/apps/population-service ./dist

ENV NODE_ENV=production

CMD ["node", "dist/main"]
