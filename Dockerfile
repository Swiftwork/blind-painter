# Latest long term support image on smallest base distro 
FROM node:10.16-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

ENV NODE_ENV=production

# Bundle api source
COPY . .

EXPOSE 5200

CMD [ "node", "index.js" ]
