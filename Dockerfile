FROM node:24-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends python3 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . .
ARG CG_SOURCE_COMMIT
ENV CG_SOURCE_COMMIT=$CG_SOURCE_COMMIT
RUN test -n "$CG_SOURCE_COMMIT" && node scripts/build-workbench.mjs

FROM node:24-bookworm-slim
WORKDIR /app
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/service ./service
COPY --from=build --chown=node:node /app/drizzle ./drizzle
COPY --from=build --chown=node:node /app/package.json ./package.json
RUN mkdir /data && chown node:node /data
USER node
ENV CG_HOST=0.0.0.0 PORT=4317 CG_DB=/data/workbench.sqlite
EXPOSE 4317
CMD ["node", "service/standalone.mjs"]
