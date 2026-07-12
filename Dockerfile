# Node.js Base Image
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy dependency configs
COPY package*.json ./

# Install dependencies (including devDependencies for building frontend)
RUN npm ci

# Copy codebase
COPY . .

# Build the Vite static assets
RUN npm run build

# --- Production runner image ---
FROM node:20-alpine

WORKDIR /app

# Copy package configs
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production

# Copy built frontend assets and backend server files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Run signaling + Express server
CMD ["node", "server/index.js"]
