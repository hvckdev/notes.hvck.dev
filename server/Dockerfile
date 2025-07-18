FROM node:20-alpine3.20 AS BUILD_IMAGE

# install dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Copy all local files into the image.
COPY . .

RUN apk update \
    && apk add --no-cache openssl\
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /var/cache/apk/*

RUN ln -s /usr/lib/libssl.so.1.1 /lib/libssl.so.1.1

RUN npx prisma generate

RUN npm run build

# remove development dependencies
RUN npm prune --production

FROM node:20-alpine3.20

WORKDIR /app
COPY --from=0 /app .

ENV PORT 8080
EXPOSE 8080

CMD ["node", "./build/src/server.js"]
