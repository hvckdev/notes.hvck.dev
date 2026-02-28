FROM node:20-alpine3.20 AS BUILD_IMAGE

# install dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install


# Copy all local files into the image.
COPY . .

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
