FROM node:14-buster
MAINTAINER frassinier <frassinier@talend.com>

RUN rm /bin/sh && ln -s /bin/bash /bin/sh

RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections

RUN apt update -yq \
   && apt install curl inkscape imagemagick potrace librsvg2-bin -yq \
   && apt -y autoclean

RUN mkdir -p /usr/local/nvm

ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION 16.14.0

RUN mkdir -p $NVM_DIR

RUN curl --silent -o- https://raw.githubusercontent.com/creationix/nvm/v0.39.1/install.sh | bash \
    && . $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default

ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

WORKDIR /usr/src/app/processing

COPY . .

RUN npm install

EXPOSE 1234
CMD [ "npm", "start" ]