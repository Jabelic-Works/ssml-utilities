FROM node:22-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV MECABRC=/etc/mecabrc
ENV MECAB_DICDIR=/var/lib/mecab/dic/unidic
ENV UNIDIC_DIR=/var/lib/mecab/dic/unidic
ENV MECAB_OUTPUT_FORMAT=unidic22

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    mecab \
    mecab-utils \
    unidic-mecab \
  && rm -rf /var/lib/apt/lists/*

COPY package.json ./package.json
COPY dist ./dist

EXPOSE 8080

CMD ["node", "dist/server.mjs"]
