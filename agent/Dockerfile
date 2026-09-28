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
ARG BUILDX_VERSION=0.24.0
RUN apk add --no-cache docker-cli git curl && \
    mkdir -p /usr/local/lib/docker/cli-plugins && \
    curl -fsSL -o /usr/local/lib/docker/cli-plugins/docker-buildx \
      "https://github.com/docker/buildx/releases/download/v${BUILDX_VERSION}/buildx-v${BUILDX_VERSION}.linux-amd64" && \
    chmod +x /usr/local/lib/docker/cli-plugins/docker-buildx
ENV DOCKER_BUILDKIT=1
CMD ["node", "dist/index.js"]
