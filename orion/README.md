# Orion

Orion is (currently) a view count service for Atlas. Its purpose is to count and provide number of view counts for every video in the content directory. At the moment it follows the most simplistic approach - it doesn't do any kind of verification so anyone can add a view count to a video.

### Starting a dev server

```shell script
yarn install
yarn run dev
```

### Deployment

Orion requires a MongoDB instance to work properly. The following env variables are used to point Orion to the correct instance:

- `ORION_MONGO_HOSTNAME`
- `ORION_MONGO_PORT`
- `ORION_MONGO_DATABASE`

#### Docker

For ease of deployment the app was dockerized. There's also the `docker-compose.yml` which will be the easiest to deploy as it contains the Orion and MongoDB and also sets all the required parameters. 
