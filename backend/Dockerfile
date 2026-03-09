# Builder stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Set a dummy DATABASE_URL for Prisma generate (it doesn't need a real DB)
ENV DATABASE_URL=postgresql://dummy:dummy@dummy:5432/dummy?schema=public
RUN npx prisma generate

# Build the NestJS application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built assets and production dependencies from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Expose the port your app runs on
EXPOSE 3001

# Start the application
CMD sh -c "npx prisma migrate deploy && node dist/src/main"
