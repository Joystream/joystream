
IMAGE=joystream/node:6740a4ae2bf40fe7c670fb49943cbbe290277601
LATEST_TAG=joystream/node:latest
docker manifest create $LATEST_TAG $IMAGE-amd64 $IMAGE-arm64 $IMAGE-arm
docker manifest annotate $LATEST_TAG $IMAGE-amd64 --arch amd64
docker manifest annotate $LATEST_TAG $IMAGE-arm64 --arch arm64
docker manifest annotate $LATEST_TAG $IMAGE-arm --arch arm
docker manifest push $LATEST_TAG
