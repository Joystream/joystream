#!/usr/bin/env bash
set -e

SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")"
cd $SCRIPT_PATH

# Setup 3-of-4 multisig sudo with //Alice, //Bob, //Charlie and //Dave
export NEW_SUDO_MULTISIG_KEYS=j4W7rVcUCxi2crhhjRq46fNDRbVHTjJrz6bKxZwehEMQxZeSf,j4UYhDYJ4pz2ihhDDzu69v2JTVeGaGmTebmBdWaX2ANVinXyE,j4UbMHiS79yvMLJctXggUugkkKmwxG5LW2YSy3ap8SmgF5qW9,j4SR5Mty5Mzy2dPTunA6TD4gBTwbSb8wRTabvu2gsLqC271d4
export SUDO_MULTISIG_THRESHOLD=3
yarn workspace api-scripts sudo-set-multisig

# Use //Alice, //Bob and //Charlie as sudo multisig signers and execute initialize-lead script
export SUDO_MULTISIG_KEYS=$NEW_SUDO_MULTISIG_KEYS
export SUDO_MULTISIG_URIS=//Alice,//Bob,//Charlie
GROUP=operationsWorkingGroupAlpha yarn workspace api-scripts initialize-lead

# Change multisig threshold to 2
export SUDO_MULTISIG_THRESHOLD=2
yarn workspace api-scripts sudo-set-multisig

# Use //Charlie and //Dave as sudo multisig signers and execute initialize-lead script
export SUDO_MULTISIG_URIS=//Charlie,//Dave
GROUP=operationsWorkingGroupBeta yarn workspace api-scripts initialize-lead

# Change multisig threshold to 1
export SUDO_MULTISIG_THRESHOLD=1
yarn workspace api-scripts sudo-set-multisig

# Use //Bob as sudo multisig signer and execute initialize-lead script
export SUDO_MULTISIG_URIS=//Bob
GROUP=operationsWorkingGroupGamma yarn workspace api-scripts initialize-lead