FROM node:20-slim

# Install dependencies for Chrome
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    --no-install-recommends

# Install Chrome
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Expose ports
EXPOSE 3000 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV BROWSER_HEADLESS=true
ENV BROWSER_EXECUTABLE_PATH=/usr/bin/google-chrome

# Run the application
CMD ["node", "dist/index.js"] 