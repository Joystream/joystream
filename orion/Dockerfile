FROM node:12 AS build

WORKDIR /usr/src/orion

COPY . .
RUN yarn install --frozen-lockfile
RUN yarn run build


FROM node:12

WORKDIR /usr/src/orion

COPY package.json .
COPY yarn.lock .
COPY --from=build /usr/src/orion/dist dist/
RUN yarn install --frozen-lockfile --production

CMD ["yarn", "start"]
