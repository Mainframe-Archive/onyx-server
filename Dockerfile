FROM node:9
WORKDIR /var/www
ADD package.json yarn.lock /tmp/
RUN cd /tmp && yarn
RUN mkdir -p /var/www && cd /var/www && ln -s /tmp/node_modules
COPY . /var/www
EXPOSE 5000
CMD ["yarn", "start"]
