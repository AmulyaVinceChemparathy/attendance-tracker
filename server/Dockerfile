# syntax=docker/dockerfile:1
FROM node:20-alpine

# Install sqlite runtime dependency
RUN apk add --no-cache sqlite

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy source
COPY src ./src

# Environment and port
ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "src/index.js"]

