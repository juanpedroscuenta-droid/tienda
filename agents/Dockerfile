FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Environment variables
ENV PORT=3000

EXPOSE 3000

CMD ["node", "index.js"]
