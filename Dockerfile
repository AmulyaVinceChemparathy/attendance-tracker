# Multi-stage build for client-server application
FROM node:18-alpine AS client-builder

# Build client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Build server
FROM node:18-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./

# Production stage
FROM node:18-alpine
WORKDIR /app

# Copy server files
COPY --from=server-builder /app/server ./

# Copy built client files
COPY --from=client-builder /app/client/dist ./public

# Install production dependencies
RUN npm ci --only=production

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the server
CMD ["node", "src/index.js"]
