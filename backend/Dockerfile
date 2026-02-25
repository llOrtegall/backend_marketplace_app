FROM oven/bun:canary-slim

WORKDIR /app

COPY . /app

RUN bun install

EXPOSE 80

CMD ["bun", "run", "src/server.ts"]