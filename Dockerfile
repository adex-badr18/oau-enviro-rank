# 1. Base image with necessary build tools for compiling native dependencies
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat python3 make g++ sqlite-dev
WORKDIR /app

# 2. Install dependencies based on package-lock.json
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# 3. Build application bundle and generate database clients
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set telemetry off during build
ENV NEXT_TELEMETRY_DISABLED 1

# Generate client and build standalone output
RUN npx prisma generate
RUN npm run build

# 4. Production Runner stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-privileged system user for running the server
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static assets and standalone bundle
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy schema and dev database (for local Docker testing/SQLite storage)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/dev.db ./dev.db

# Configure environment variables
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

USER nextjs

CMD ["node", "server.js"]
