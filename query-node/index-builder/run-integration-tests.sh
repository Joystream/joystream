function cleanup()
{
    docker-compose -f docker-compose-test.yml down
}


docker run --network="index-builder_default"  \
           --env TYPEORM_HOST=db  \
           --env DB_HOST=db  \
           --env PGHOST=db  \
           --env REDIS_URI=redis://redis:6379/0  \
           --env WS_PROVIDER_URI=ws://substrate:9944 \
           -v $PWD:/index-builder \
           node:12-alpine \
           sh -c "cd /index-builder && yarn && yarn build && yarn i-test-local"

trap cleanup EXIT
