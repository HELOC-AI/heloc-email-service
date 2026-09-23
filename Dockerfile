# Node 24 runs the TypeScript sources directly (type stripping): no build step.
FROM node:24-slim
ENV NODE_ENV=production
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY src ./src
USER node
EXPOSE 3000
CMD ["node", "src/main.ts"]
