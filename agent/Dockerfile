# syntax=docker/dockerfile:1
# Build from repo root: docker build -f agent/Dockerfile -t deployhub-agent .
FROM node:20-alpine AS build
WORKDIR /app/agent
COPY agent/package.json ./
RUN npm install
COPY agent/tsconfig.json ./
COPY agent/src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY agent/package.json ./
RUN npm install --omit=dev
COPY --from=build /app/agent/dist ./dist
RUN apk add --no-cache docker-cli git
CMD ["node", "dist/index.js"]
