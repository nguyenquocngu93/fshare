FROM node:22-alpine

WORKDIR /app

COPY --chown=node:node package.json server.mjs ./
COPY --chown=node:node public ./public

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8787 \
    TMDB_LANGUAGE=vi-VN \
    TMDB_REGION=VN \
    DNS_RESULT_ORDER=ipv4first

USER node
EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8787/api/health || exit 1

CMD ["node", "server.mjs"]
