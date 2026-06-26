FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/admin-web/package.json ./apps/admin-web/package.json
COPY apps/foundation-console/package.json ./apps/foundation-console/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN npm install

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3001
CMD ["npm", "--workspace", "apps/admin-web", "run", "dev"]
