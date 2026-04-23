# Use a lightweight Node.js image
FROM node:18-slim

# Install Python, G++ (C++), and Java JDK
RUN apt-get update && apt-get install -y \
    python3 \
    g++ \
    default-jdk \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package.json first to install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port (Render sets the PORT environment variable)
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]