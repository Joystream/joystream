#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

export AUTO_CONFIRM=true
export OCLIF_TS_NODE=0

yarn workspace @joystream/cli build

CLI=../bin/run

# Remove accounts added by previous test runs if needed
${CLI} account:forget --name test_alice_member_controller_1 || true
${CLI} account:forget --name test_alice_member_root_1 || true
${CLI} account:forget --name test_alice_member_controller_2 || true
${CLI} account:forget --name test_alice_member_staking || true

# Create membership (controller: //Alice//controller, root: //Alice//root, sender: //Alice)
MEMBER_HANDLE="alice-$(date +%s)"
MEMBER_ID=`${CLI} membership:buy\
  --about="Test about text"\
  --avatarUri="http://example.com/example.jpg"\
  --controllerKey="5FnEMwYzo9PRGkGV4CtFNaCNSEZWA3AxbpbxcxamxdvMkD19"\
  --handle="$MEMBER_HANDLE"\
  --name="Alice"\
  --rootKey="5CVGusS1N7brUBqfVE1XgUeowHMD8o9xpk2mMXdFrrnLmM1v"\
  --senderKey="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"`

# Import //Alice//controller key
${CLI} account:import\
  --suri //Alice//controller\
  --name test_alice_member_controller_1\
  --password=""

# Transfer some funds to //Alice//controller key
${CLI} account:transferTokens\
  --amount 10000\
  --from 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY\
  --to 5FnEMwYzo9PRGkGV4CtFNaCNSEZWA3AxbpbxcxamxdvMkD19

# Update membership
${CLI} membership:update\
  --useMemberId="$MEMBER_ID"\
  --newHandle="$MEMBER_HANDLE-updated"\
  --newName="Alice Updated"\
  --newAvatarUri="http://example.com/updated.jpg"\
  --newAbout="Test about text updated"

# Import //Alice//root key
${CLI} account:import\
  --suri //Alice//root\
  --name test_alice_member_root_1\
  --password=""

# Transfer some funds to //Alice//root key
${CLI} account:transferTokens\
  --amount 10000\
  --from 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY\
  --to 5CVGusS1N7brUBqfVE1XgUeowHMD8o9xpk2mMXdFrrnLmM1v

# Update accounts (//Alice//controller//0, //Alice//root//0)
${CLI} membership:updateAccounts\
  --useMemberId="$MEMBER_ID"\
  --newControllerAccount="5E5JemkFX48JMRFraGZrjPwKL1HnhLkPrMQxaBvoSXPmzKab"\
  --newRootAccount="5HBBGjABKMczXYGmGZe9un3VYia1BmedLsoXJFWAtBtGVahv"

# Import //Alice//controller//0 key
${CLI} account:import\
  --suri //Alice//controller//0\
  --name test_alice_member_controller_2\
  --password=""

# Transfer some funds to //Alice//controller//0 key
${CLI} account:transferTokens\
  --amount 10000\
  --from 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY\
  --to 5E5JemkFX48JMRFraGZrjPwKL1HnhLkPrMQxaBvoSXPmzKab

# Import //Alice//staking key
${CLI} account:import\
  --suri //Alice//staking\
  --name test_alice_member_staking\
  --password=""

# Add staking account (//Alice//staking)
${CLI} membership:addStakingAccount\
  --useMemberId="$MEMBER_ID"\
  --address="5EheygkSi4q4QCN12d2Vy65EnoEtdJy6yw6o7XZpPRcaVJCS"\
  --fundsSource="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"\
  --withBalance="10000"

# Remove imported accounts
${CLI} account:forget --name test_alice_member_controller_1
${CLI} account:forget --name test_alice_member_root_1
${CLI} account:forget --name test_alice_member_controller_2
${CLI} account:forget --name test_alice_member_staking
