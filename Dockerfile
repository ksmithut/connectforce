FROM node:16-alpine AS base

RUN apk --no-cache add --virtual build-deps build-base python3

# Create app directory
RUN mkdir -p /app && chown node:node /app
USER node
WORKDIR /app

# Install dependencies
COPY --chown=node:node package.json yarn.lock ./
RUN yarn

# Build client
COPY --chown=node:node src/client ./src/client
COPY --chown=node:node .parcelrc ./
RUN yarn build

# ---------------------
# --- Release layer ---
# ---------------------
FROM node:16-alpine AS release

# Create app directory
RUN mkdir -p /app && chown node:node /app
USER node
WORKDIR /app

# Copy public dir
COPY --from=base --chown=node:node /app/public /app/public
COPY --from=base --chown=node:node /app/node_modules /app/node_modules

# Install dependencies
COPY --chown=node:node package.json yarn.lock ./
RUN yarn --production

# Bundle app source
COPY --chown=node:node src src

# Exports
EXPOSE 3000
CMD [ "node", "src/bin/server.js", "start", "--migrate" ]
