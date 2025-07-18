# FROM node:16-alpine AS BUILD_IMAGE

# # install dependencies
# WORKDIR /app
# COPY package.json package-lock.json ./
# RUN npm ci

# # Copy all local files into the image.
# COPY . .
# COPY .env.docker .env

# RUN npx prisma generate

# # remove development dependencies
# RUN npm prune --production

# CMD ["npx", "prisma migrate deploy

FROM node:18-alpine

RUN echo $DATABASE_URL

# Create app directory
WORKDIR /app

# Install prisma for the migration
RUN npm install -g prisma --unsafe-perm

# Copy schema and migration folder
ADD ./ ./prisma/

RUN apk update \
    && apk add --no-cache openssl\
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /var/cache/apk/*

RUN ln -s /usr/lib/libssl.so.3 /lib/libssl.so.3

CMD [ "prisma", "migrate", "deploy"]
