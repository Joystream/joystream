#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

export AUTO_CONFIRM=true
export OCLIF_TS_NODE=0

yarn workspace @joystream/cli build

CLI=../bin/run

# Init forum lead
GROUP=forumWorkingGroup yarn workspace api-scripts initialize-lead
# Add integration tests lead key (in case the script is executed after ./start.sh)
yarn joystream-cli account:forget --name "Test forum lead key" || true
yarn joystream-cli account:import --suri //testing//worker//Forum//0 --name "Test forum lead key" --password ""

# Assume leader is the first worker
LEADER_WORKER_ID="0"

# Create test categories
CATEGORY_1_ID=`${CLI} forum:createCategory -t "Test category 1" -d "Test category 1 description"`
CATEGORY_2_ID=`${CLI} forum:createCategory -t "Test category 2" -d "Test category 2 description" -p ${CATEGORY_1_ID}`
# Create test threads
THREAD_1_ID=`${CLI} forum:createThread \
  --categoryId ${CATEGORY_1_ID}\
  --title "Test thread 1"\
  --tags "tag1" "tag2" "tag3"\
  --text "Test thread 1 initial post text"`
THREAD_2_ID=`${CLI} forum:createThread \
  --categoryId ${CATEGORY_2_ID}\
  --title "Test thread 2"\
  --tags "tag1" "tag2" "tag3"\
  --text "Test thread 2 initial post text"`
# Create test posts
POST_1_ID=`${CLI} forum:addPost \
  --categoryId ${CATEGORY_1_ID}\
  --threadId ${THREAD_1_ID}\
  --text "Test post 1"\
  --editable`
POST_2_ID=`${CLI} forum:addPost \
  --categoryId ${CATEGORY_2_ID}\
  --threadId ${THREAD_2_ID}\
  --text "Test post 2"\
  --editable`

# Update category modrator permissions
${CLI} forum:updateCategoryModeratorStatus --categoryId ${CATEGORY_1_ID} --workerId ${LEADER_WORKER_ID} --status active

# Update category archival status as lead
${CLI} forum:updateCategoryArchivalStatus --categoryId ${CATEGORY_1_ID} --archived yes --context Leader
# Update category archival status as moderator
${CLI} forum:updateCategoryArchivalStatus --categoryId ${CATEGORY_1_ID} --archived no --context Moderator

# Move thread as lead
${CLI} forum:moveThread --categoryId ${CATEGORY_1_ID} --threadId ${THREAD_1_ID} --newCategoryId ${CATEGORY_2_ID} --context Leader
# Move thread as moderator
${CLI} forum:moveThread --categoryId ${CATEGORY_2_ID} --threadId ${THREAD_2_ID} --newCategoryId ${CATEGORY_1_ID} --context Moderator

# Set stickied threads as lead
${CLI} forum:setStickiedThreads --categoryId ${CATEGORY_1_ID} --threadIds ${THREAD_2_ID} --context Leader
# Set stickied threads as moderator
${CLI} forum:setStickiedThreads --categoryId ${CATEGORY_2_ID} --threadIds ${THREAD_1_ID} --context Moderator

# Moderate post as lead
${CLI} forum:moderatePost \
  --categoryId ${CATEGORY_2_ID}\
  --threadId ${THREAD_1_ID}\
  --postId ${POST_1_ID}\
  --rationale "Leader test"\
  --context Leader
# Moderate post as moderator
${CLI} forum:moderatePost \
  --categoryId ${CATEGORY_1_ID}\
  --threadId ${THREAD_2_ID}\
  --postId ${POST_2_ID}\
  --rationale "Moderator test"\
  --context Moderator

# Moderate thread as lead
${CLI} forum:moderateThread --categoryId ${CATEGORY_2_ID} --threadId ${THREAD_1_ID} --rationale "Leader test" --context Leader
# Moderate thread as moderator
${CLI} forum:moderateThread --categoryId ${CATEGORY_1_ID} --threadId ${THREAD_2_ID} --rationale "Moderator test" --context Moderator

# Delete category as moderator
${CLI} forum:deleteCategory --categoryId ${CATEGORY_2_ID} --context Moderator
# Delete category as lead
${CLI} forum:deleteCategory --categoryId ${CATEGORY_1_ID} --context Leader

# Forget test lead account
yarn joystream-cli account:forget --name "Test forum lead key"
