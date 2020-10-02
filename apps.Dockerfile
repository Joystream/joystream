FROM node:12

WORKDIR /joystream
COPY . /joystream

# Setup npm prefix
# RUN echo "prefix=${HOME}/npm" > ${HOME}/.npmrc 
# ENV PATH=$PATH:$HOME/npm/bin/

ENV NODE_ENV=production
RUN yarn
RUN yarn workspace pioneer build
RUN yarn workspace @joystream/cli build
RUN yarn workspace storage-node build

ENTRYPOINT [ "yarn" ]
