# Multi-stage Dockerfile for SvelteKit Application

# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Copy application source
COPY . .

# Build the application
RUN npm run build

# Stage 1.5: Install production dependencies only
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Stage 2: Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Install PostgreSQL client for database connectivity (optional but recommended)
RUN apk add --no-cache postgresql-client

# Copy built application from builder
COPY --from=builder /app/build ./build

# Copy production dependencies from deps
COPY --from=deps /app/node_modules ./node_modules

# Copy package.json
COPY --from=builder /app/package.json ./package.json

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S sveltekit -u 1001

# Change ownership of the app directory
RUN chown -R sveltekit:nodejs /app

# Switch to non-root user
USER sveltekit

# Expose the application port
EXPOSE 5173

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5173
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5173/', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the application
CMD ["node", "build/index.js"]
