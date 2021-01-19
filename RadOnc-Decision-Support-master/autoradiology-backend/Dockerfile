FROM node:11

WORKDIR /app/

COPY package.json /app/
RUN npm install

COPY . /app/

EXPOSE 3001

CMD node bin/www
