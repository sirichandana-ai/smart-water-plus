# Use Node.js image
FROM node:20

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy all frontend files
COPY . .

# Expose port
EXPOSE 5173

# Start React app
CMD ["npm", "run", "dev"]
