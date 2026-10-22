FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN npm install -g pnpm@12.11.2
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 NEWS_DATA_PATH=/app/data/news.json
WORKDIR /app
COPY --from=build --chown=node:node /app/.output ./.output
RUN mkdir /app/data && chown node:node /app/data
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
