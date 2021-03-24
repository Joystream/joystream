set -a
. ../.env
set +a

# Start the joystream-node first to allow fetching Olympia metadata during build (typegen)
docker-compose up -d joystream-node

# Only run codegen if no generated files found
[ ! -d "generated/" ] && yarn build

# Bring up db
docker-compose up -d db

# Make sure we use dev config for db migrations (prevents "Cannot create database..." and some other errors)
yarn workspace query-node config:dev

# Migrate the databases
yarn workspace query-node-root db:prepare
yarn workspace query-node-root db:migrate

# Initialize databse (ie. membership module configuration)
yarn workspace query-node-root db:init

docker-compose up -d graphql-server-mnt

# Starting up processor will bring up all services it depends on
docker-compose up -d processor-mnt
