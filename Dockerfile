# --- Stage 1: Build ---
FROM node:20-slim AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm install

# Copy source code and build TypeScript
COPY . .
RUN npm run build

# Prune dev dependencies for a smaller production install
RUN npm prune --production

# --- Stage 2: Production ---
FROM node:20-slim
WORKDIR /app

# Copy built code and production node_modules from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Expose the application port
EXPOSE 12009

# Command to run the application
CMD [ "npm", "start" ]