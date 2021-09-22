#!/usr/bin/env bash

# Requires:
# yarn storage-node dev:init
# ./scripts/init-bucket.sh or ./scripts/run-all-commands.sh
# yarn storage-node server --dev -w 0 -d ./uploads-dir -o 3333

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

CLI=../bin/run
TMP_DATA_DIR=~/tmp

# Prepare data objects (random images of increasing size)
for OBJECT_ID in {0..2}
do
FILE_PATH="$TMP_DATA_DIR/$OBJECT_ID.png"
IMAGE_XY_LEN=$(( 200*(OBJECT_ID+1) ))
head -c "$((3*IMAGE_XY_LEN**2))" /dev/urandom | convert -depth 8 -size "${IMAGE_XY_LEN}x${IMAGE_XY_LEN}" RGB:- $FILE_PATH
HASH=$(${CLI} dev:multihash -f "$FILE_PATH")
yarn storage-node dev:upload -s $(stat -c %s $FILE_PATH) -c "$HASH"
done

# Upload data objects
for OBJECT_ID in {0..2}
do
export OBJECT_ID
FILE_PATH="$TMP_DATA_DIR/$OBJECT_ID.png"
SIGNATURE=$(yarn ts-node ./scripts/create-auth-request-signature.ts | sed -n 3p | jq -r .signature)
echo "object id: $OBJECT_ID"
echo "file path: $FILE_PATH"
echo "signature: $SIGNATURE"
TOKEN=$(curl -X 'POST' \
  'http://localhost:3333/api/v1/authToken' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d "{
  \"data\": {
    \"memberId\": 0,
    \"accountId\": \"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY\",
    \"dataObjectId\": $OBJECT_ID,
    \"storageBucketId\": 0,
    \"bagId\": \"static:council\"
  },
  \"signature\": \"$SIGNATURE\"
}" | jq -r .token)

curl -X 'POST' \
  'http://localhost:3333/api/v1/files' \
  -H 'accept: application/json' \
  -H "x-api-key: $TOKEN" \
  -H 'Content-Type: multipart/form-data' \
  -F "file=@$FILE_PATH;type=video/mp4" \
  -F "dataObjectId=$OBJECT_ID" \
  -F 'storageBucketId=0' \
  -F 'bagId=static:council'
done
