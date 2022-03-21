#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

export AUTO_CONFIRM=true
export OCLIF_TS_NODE=0

yarn workspace @joystream/cli build

CLI=../bin/run

# Use storage working group as default group
TEST_LEAD_SURI="//testing//worker//Storage//0"

# Init lead
GROUP="storageWorkingGroup" yarn workspace api-scripts initialize-lead
# CLI commands group
GROUP="storageProviders"
# Add integration tests lead key (in case the script is executed after ./start.sh)
${CLI} account:forget --name "Test wg lead key" || true
${CLI} account:import --suri ${TEST_LEAD_SURI} --name "Test wg lead key" --password "" || true
# Set/update working group metadata
${CLI} working-groups:updateGroupMetadata --group ${GROUP} -i ../examples/working-groups/UpdateMetadata.json
# Create upcoming opening
UPCOMING_OPENING_ID=`${CLI} working-groups:createOpening \
  --group ${GROUP} \
  --input ../examples/working-groups/CreateOpening.json \
  --upcoming \
  --startsAt 2030-01-01`
# Delete upcoming opening
${CLI} working-groups:removeUpcomingOpening --group ${GROUP} --id ${UPCOMING_OPENING_ID}
# Create opening
OPENING_ID=`${CLI} working-groups:createOpening \
  --group ${GROUP} \
  --input ../examples/working-groups/CreateOpening.json \
  --stakeTopUpSource 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY`
# Setup a staking account (//Alice//worker-stake)
${CLI} account:forget --name "Test worker staking key" || true
${CLI} account:import --suri //Alice//worker-stake --name "Test worker staking key" --password "" || true
${CLI} membership:addStakingAccount \
  --address 5Dyzr3jNj1JngvJPDf4dpjsgZqZaUSrhFMdmKJMYkziv74qt \
  --withBalance 2000 \
  --fundsSource 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
# Apply
APPLICATION_ID=`${CLI} working-groups:apply \
  --group ${GROUP} \
  --openingId ${OPENING_ID} \
  --roleAccount 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY \
  --rewardAccount 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY \
  --stakingAccount 5Dyzr3jNj1JngvJPDf4dpjsgZqZaUSrhFMdmKJMYkziv74qt \
  --answers "Alice" "30" "I'm the best!"`
# Fill opening
${CLI} working-groups:fillOpening \
  --group ${GROUP} \
  --openingId ${OPENING_ID} \
  --applicationIds ${APPLICATION_ID}
# Forget test lead account and test worker staking account
${CLI} account:forget --name "Test wg lead key"
${CLI} account:forget --name "Test worker staking key"
