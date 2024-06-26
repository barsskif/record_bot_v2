FROM node:16.18-slim

RUN apt-get update && \
    apt-get install -y \
    wget \
    default-jdk \
    xvfb \
    gnupg2 \
    unzip \
    libxss1 \
    curl \
    ffmpeg

#RUN google-chrome --version | grep -oE "[0-9]{1,10}.[0-9]{1,10}.[0-9]{1,10}" > /tmp/chromebrowser-main-version.txt
#RUN wget --no-verbose -O /tmp/latest_chromedriver_version.txt https://chromedriver.storage.googleapis.com/LATEST_RELEASE_$(cat /tmp/chromebrowser-main-version.txt)
#RUN wget --no-verbose -O /tmp/chromedriver_linux64.zip https://chromedriver.storage.googleapis.com/$(cat /tmp/latest_chromedriver_version.txt)/chromedriver_linux64.zip && rm -rf /#opt/selenium/chromedriver && unzip /tmp/chromedriver_linux64.zip -d /opt/selenium && rm /tmp/chromedriver_linux64.zip && mv /opt/selenium/chromedriver /opt/selenium/chromedriver-$(cat /tmp/latest_chromedriver_version.txt) && chmod 755 /opt/selenium/chromedriver-$(cat /tmp/latest_chromedriver_version.txt) && ln -fs /opt/selenium/chromedriver-$(cat /tmp/#latest_chromedriver_version.txt) /usr/bin/chromedriver

# install google chrome
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
RUN apt-get -y update
RUN apt-get install -y google-chrome-stable

# install chromedriver
RUN apt-get install -yqq unzip
RUN wget -O /tmp/chromedriver.zip http://chromedriver.storage.googleapis.com/`curl -sS chromedriver.storage.googleapis.com/LATEST_RELEASE`/chromedriver_linux64.zip
RUN unzip /tmp/chromedriver.zip chromedriver -d /usr/local/bin/

RUN apt-get remove -y \
    wget \
    unzip \
    curl \
    && apt-get clean \
    && rm -rf /tmp/*

# set display port to avoid crash
ENV DISPLAY=:99



RUN apt-get remove -y wget unzip && rm -rf /tmp/*

WORKDIR /app
# RUN npm set version berry
COPY package*.json ./
# RUN yarn add typescript
RUN yarn
COPY . ./

# RUN yarn build
# CMD Xvfb :99 -screen 0 1024x768x32 & node ./server.js

CMD ["node", "/app/server.js"]