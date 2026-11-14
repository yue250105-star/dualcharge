# ---------- 构建阶段：安装依赖并打包前端 ----------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

# ---------- 运行阶段：直接复用构建阶段的 node_modules，不再二次安装 ----------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
COPY server.ts ./
COPY server ./server
COPY src ./src

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD wget -qO- http://127.0.0.1:${PORT:-3000}/api/health || exit 1

CMD ["npx", "tsx", "server.ts"]
