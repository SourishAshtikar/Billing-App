# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Copy source and build
COPY . .
# Set dummy DATABASE_URL for build-time prisma generate
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy only necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Create uploads directory and set permissions
RUN mkdir -p /app/uploads && chmod 755 /app/uploads

# Set up a non-root user
RUN addgroup -S nodejs && adduser -S billingapp -G nodejs && chown -R billingapp:nodejs /app
USER billingapp

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

CMD ["npm", "start"]
