#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

echo "{}" > ~/tmp/empty.json

export AUTO_CONFIRM=true

# Init content lead
GROUP=contentWorkingGroup yarn workspace api-scripts initialize-lead
# Add integration tests lead key (in case the script is executed after ./start.sh)
yarn joystream-cli account:import --suri //testing//worker//Content//0 --name "Test content lead key" --password "" || true
# Test create/update/remove category
yarn joystream-cli content:createVideoCategory -i ./examples/content/CreateCategory.json
yarn joystream-cli content:createVideoCategory -i ./examples/content/CreateCategory.json
yarn joystream-cli content:createVideoCategory -i ./examples/content/CreateCategory.json
yarn joystream-cli content:createChannelCategory -i ./examples/content/CreateCategory.json
yarn joystream-cli content:createChannelCategory -i ./examples/content/CreateCategory.json
yarn joystream-cli content:createChannelCategory -i ./examples/content/CreateCategory.json
yarn joystream-cli content:updateVideoCategory -i ./examples/content/UpdateCategory.json 2
yarn joystream-cli content:updateChannelCategory -i ./examples/content/UpdateCategory.json 2
yarn joystream-cli content:deleteChannelCategory 3
yarn joystream-cli content:deleteVideoCategory 3
# Group 1 - a valid group
yarn joystream-cli content:createCuratorGroup
yarn joystream-cli content:setCuratorGroupStatus 1 1
yarn joystream-cli content:addCuratorToGroup 1 0
# Group 2 - test removeCuratorFromGroup
yarn joystream-cli content:createCuratorGroup
yarn joystream-cli content:addCuratorToGroup 2 0
yarn joystream-cli content:removeCuratorFromGroup 2 0
# Create/update channel
yarn joystream-cli content:createChannel -i ./examples/content/CreateChannel.json --context Member || true
yarn joystream-cli content:createChannel -i ./examples/content/CreateChannel.json --context Curator || true
yarn joystream-cli content:createChannel -i ~/tmp/empty.json --context Member || true
yarn joystream-cli content:updateChannel -i ./examples/content/UpdateChannel.json 1 || true
# Create/update video
yarn joystream-cli content:createVideo -i ./examples/content/CreateVideo.json -c 1 || true
yarn joystream-cli content:createVideo -i ./examples/content/CreateVideo.json -c 2 || true
yarn joystream-cli content:createVideo -i ~/tmp/empty.json -c 2 || true
yarn joystream-cli content:updateVideo -i ./examples/content/UpdateVideo.json 1 || true
# Set featured videos
yarn joystream-cli content:setFeaturedVideos 1,2
yarn joystream-cli content:setFeaturedVideos 2,3
# Update channel censorship status
yarn joystream-cli content:updateChannelCensorshipStatus 1 1 --rationale "Test"
yarn joystream-cli content:updateVideoCensorshipStatus 1 1 --rationale "Test"
# Display-only commands
yarn joystream-cli content:videos
yarn joystream-cli content:video 1
yarn joystream-cli content:channels
yarn joystream-cli content:channel 1
yarn joystream-cli content:curatorGroups
yarn joystream-cli content:curatorGroup 1
# Remove videos/channels/assets
yarn joystream-cli content:removeChannelAssets -c 1 -o 0
yarn joystream-cli content:deleteVideo -v 1 -f
yarn joystream-cli content:deleteVideo -v 2 -f
yarn joystream-cli content:deleteVideo -v 3 -f
yarn joystream-cli content:deleteChannel -c 1 -f
yarn joystream-cli content:deleteChannel -c 2 -f
yarn joystream-cli content:deleteChannel -c 3 -f
