FROM node:22-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package.json ./package.json
COPY dist ./dist

EXPOSE 8080

CMD ["node", "dist/server.js"]
