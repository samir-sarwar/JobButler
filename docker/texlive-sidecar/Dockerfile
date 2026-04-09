FROM texlive/texlive:latest

WORKDIR /app

# Install Node.js
RUN apt-get update && \
    apt-get install -y nodejs npm && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy server
COPY server.js ./

EXPOSE 3002

CMD ["node", "server.js"]
