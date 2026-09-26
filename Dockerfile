FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lock tsconfig.json ./
RUN bun install --frozen-lockfile --production

COPY src ./src
COPY scripts ./scripts
COPY public ./public
RUN bun build src/index.tsx --outdir dist --target bun --jsx-import-source hono/jsx

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "scripts/start-render.sh"]
