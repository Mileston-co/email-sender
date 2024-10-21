# Stage 1: Install dependencies and build the app
FROM node:lts-alpine AS builder

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (both development and production)
RUN npm install --silent

# Copy all the application source code
COPY . .

# Build the Next.js app
RUN npm run build

# Stage 2: Set up the production environment
FROM node:lts-alpine

WORKDIR /usr/src/app

# Set environment to production
ENV NODE_ENV=production

# Copy only production dependencies and built app from the builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/package*.json ./

# Expose the port that Next.js uses
EXPOSE 3000

# Change ownership of the app folder
RUN chown -R node /usr/src/app

# Run the app as non-root user for better security
USER node

# Start the Next.js app
CMD ["npm", "start"]
