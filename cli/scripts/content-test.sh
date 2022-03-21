#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

mkdir ~/tmp || true
echo "{}" > ~/tmp/empty.json

export AUTO_CONFIRM=true
export OCLIF_TS_NODE=0

yarn workspace @joystream/cli build

CLI=../bin/run

# Init content lead
GROUP=contentWorkingGroup yarn workspace api-scripts initialize-lead
# Add integration tests lead key (in case the script is executed after ./start.sh)
${CLI} account:forget --name "Test content lead key" || true
${CLI} account:import --suri //testing//worker//Content//0 --name "Test content lead key" --password "" || true
# Test create/update/remove category
${CLI} content:createVideoCategory -i ../examples/content/CreateCategory.json
${CLI} content:createVideoCategory -i ../examples/content/CreateCategory.json
${CLI} content:createVideoCategory -i ../examples/content/CreateCategory.json
${CLI} content:createChannelCategory -i ../examples/content/CreateCategory.json
${CLI} content:createChannelCategory -i ../examples/content/CreateCategory.json
${CLI} content:createChannelCategory -i ../examples/content/CreateCategory.json
${CLI} content:updateVideoCategory -i ../examples/content/UpdateCategory.json 2
${CLI} content:updateChannelCategory -i ../examples/content/UpdateCategory.json 2
${CLI} content:deleteChannelCategory 3
${CLI} content:deleteVideoCategory 3
# Group 1 - a valid group
${CLI} content:createCuratorGroup
${CLI} content:setCuratorGroupStatus 1 1
${CLI} content:addCuratorToGroup 1 0
# Group 2 - test removeCuratorFromGroup
${CLI} content:createCuratorGroup
${CLI} content:addCuratorToGroup 2 0
${CLI} content:removeCuratorFromGroup 2 0
# Create/update channel
${CLI} content:createChannel -i ../examples/content/CreateChannel.json --context Member || true
${CLI} content:createChannel -i ../examples/content/CreateChannel.json --context Curator || true
${CLI} content:createChannel -i ~/tmp/empty.json --context Member || true
${CLI} content:updateChannel -i ../examples/content/UpdateChannel.json 1 || true
# Create/update video
${CLI} content:createVideo -i ../examples/content/CreateVideo.json -c 1 || true
${CLI} content:createVideo -i ../examples/content/CreateVideo.json -c 2 || true
${CLI} content:createVideo -i ~/tmp/empty.json -c 2 || true
${CLI} content:updateVideo -i ../examples/content/UpdateVideo.json 1 || true
# Set featured videos
${CLI} content:setFeaturedVideos 1,2
${CLI} content:setFeaturedVideos 2,3
# Update channel censorship status
${CLI} content:updateChannelCensorshipStatus 1 1 --rationale "Test"
${CLI} content:updateVideoCensorshipStatus 1 1 --rationale "Test"
# Display-only commands
${CLI} content:videos
${CLI} content:video 1
${CLI} content:channels
${CLI} content:channel 1
${CLI} content:curatorGroups
${CLI} content:curatorGroup 1
# Remove videos/channels/assets
${CLI} content:removeChannelAssets -c 1 -o 0
${CLI} content:deleteVideo -v 1 -f
${CLI} content:deleteVideo -v 2 -f
${CLI} content:deleteVideo -v 3 -f
${CLI} content:deleteChannel -c 1 -f
${CLI} content:deleteChannel -c 2 -f
${CLI} content:deleteChannel -c 3 -f
# Forget test content lead account
${CLI} account:forget --name "Test content lead key"
