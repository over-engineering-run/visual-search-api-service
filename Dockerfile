FROM node:alpine as base

# NodeJS app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Throw-away build stage to reduce size of final image
FROM base as build

# Install node modules
COPY package.json yarn.lock .
RUN yarn install --production=false

# Copy application code
COPY . .

RUN yarn build

# Remove development dependencies
RUN yarn install --production=true


# Final stage for app image
FROM mcr.microsoft.com/playwright:v1.35.0-jammy
WORKDIR /app
ENV NODE_ENV=production

# Copy built application
COPY --from=build /app /app

# Start the server by default, this can be overwritten at runtime
CMD [ "yarn", "start" ]
