# Stage 1: Build the React app
FROM node:22-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Stage 2: Serve the app with a lightweight static server
FROM node:22-alpine AS production

WORKDIR /app

# Install a simple static server (serve)
RUN npm install -g serve

# Copy built assets from builder stage
COPY --from=base /app/dist ./dist

# Expose port 8005
EXPOSE 8005

# Start the server on port 8005
CMD ["serve", "-s", "dist", "-l", "8005"]