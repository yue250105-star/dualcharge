# ---------- 构建阶段：安装依赖并打包前端 ----------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# ---------- 运行阶段：生产环境运行 Express + 静态文件 ----------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY package.json ./
RUN npm install

COPY --from=build /app/dist ./dist
COPY server.ts ./
COPY server ./server
COPY src ./src

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s   CMD wget -qO- http://127.0.0.1:${PORT:-3000}/api/health || exit 1

CMD ["npx", "tsx", "server.ts"]
