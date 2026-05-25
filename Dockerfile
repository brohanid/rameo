# Gunakan base image Node.js yang ringan
FROM node:20-alpine AS base

# Install dependencies (dibutuhkan oleh beberapa library native)
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Build source code
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment build-time yang umum dibutuhkan (opsional jika dibutuhkan saat build)
ENV NEXT_TELEMETRY_DISABLED 1

# Run build process (akan menghasilkan folder .next/standalone)
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set permission file agar aplikasi berjalan sebagai user non-root
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy output standalone (termasuk folder node_modules hasil tracing)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Command untuk menjalankan server standalone
CMD ["node", "server.js"]
