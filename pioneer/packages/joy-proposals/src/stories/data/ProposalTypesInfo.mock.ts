import { ProposalTypeInfo } from '../../Proposal/ProposalTypePreview';
import { Categories } from '@polkadot/joy-utils/types/proposals';

const MockProposalTypesInfo: ProposalTypeInfo[] = [
  {
    type: 'Text',
    category: Categories.other,
    description:
        'Change the total reward across all validators in a given block.' +
        'This is not the direct reward, but base reward for Pallet staking module.' +
        'The minimum value must be greater than 450 tJOY based on current runtime.',
    stake: 5,
    cancellationFee: 0,
    gracePeriod: 0,
    votingPeriod: 10000,
    approvalQuorum: 80,
    approvalThreshold: 80,
    slashingQuorum: 80,
    slashingThreshold: 80
  },
  {
    type: 'Spending',
    category: Categories.other,
    description:
        'Change the total reward across all validators in a given block.' +
        'This is not the direct reward, but base reward for Pallet staking module.' +
        'The minimum value must be greater than 450 tJOY based on current runtime.',
    stake: 10,
    cancellationFee: 5,
    gracePeriod: 3,
    votingPeriod: 10000,
    approvalQuorum: 80,
    approvalThreshold: 80,
    slashingQuorum: 80,
    slashingThreshold: 80
  },
  {
    type: 'RuntimeUpgrade',
    category: Categories.other,
    description:
        'Change the total reward across all validators in a given block.' +
        'This is not the direct reward, but base reward for Pallet staking module.' +
        'The minimum value must be greater than 450 tJOY based on current runtime.',
    stake: 100,
    cancellationFee: 10,
    gracePeriod: 14,
    votingPeriod: 10000,
    approvalQuorum: 80,
    approvalThreshold: 80,
    slashingQuorum: 80,
    slashingThreshold: 80
  },
  {
    type: 'EvictStorageProvider',
    category: Categories.other,
    description:
        'Change the total reward across all validators in a given block.' +
        'This is not the direct reward, but base reward for Pallet staking module.' +
        'The minimum value must be greater than 450 tJOY based on current runtime.',
    stake: 100,
    cancellationFee: 10,
    gracePeriod: 1,
    votingPeriod: 10000,
    approvalQuorum: 80,
    approvalThreshold: 80,
    slashingQuorum: 80,
    slashingThreshold: 80
  },
  {
    type: 'SetStorageRoleParameters',
    category: Categories.other,
    description:
        'Change the total reward across all validators in a given block.' +
        'This is not the direct reward, but base reward for Pallet staking module.' +
        'The minimum value must be greater than 450 tJOY based on current runtime.',
    stake: 500,
    cancellationFee: 60,
    gracePeriod: 14,
    votingPeriod: 10000,
    approvalQuorum: 80,
    approvalThreshold: 80,
    slashingQuorum: 80,
    slashingThreshold: 80
  },
  {
    type: 'SetValidatorCount',
    category: Categories.validators,
    description:
        'Change the total reward across all validators in a given block.' +
        'This is not the direct reward, but base reward for Pallet staking module.' +
        'The minimum value must be greater than 450 tJOY based on current runtime.',
    stake: 45,
    cancellationFee: 10,
    gracePeriod: 5,
    votingPeriod: 10000,
    approvalQuorum: 80,
    approvalThreshold: 80,
    slashingQuorum: 80,
    slashingThreshold: 80
  },
  {
    type: 'SetContentWorkingGroupMintCapacity',
    category: Categories.cwg,
    description:
        'Change the total reward across all validators in a given block.' +
        'This is not the direct reward, but base reward for Pallet staking module.' +
        'The minimum value must be greater than 450 tJOY based on current runtime.',
    stake: 90,
    cancellationFee: 8,
    gracePeriod: 5,
    votingPeriod: 10000,
    approvalQuorum: 80,
    approvalThreshold: 80,
    slashingQuorum: 80,
    slashingThreshold: 80
  },
  {
    type: 'SetLead',
    category: Categories.cwg,
    description:
        'Change the total reward across all validators in a given block.' +
        'This is not the direct reward, but base reward for Pallet staking module.' +
        'The minimum value must be greater than 450 tJOY based on current runtime.',
    stake: 500,
    cancellationFee: 50,
    gracePeriod: 7,
    votingPeriod: 10000,
    approvalQuorum: 80,
    approvalThreshold: 80,
    slashingQuorum: 80,
    slashingThreshold: 80
  },
  {
    type: 'SetElectionParameters',
    category: Categories.council,
    description:
        'Change the total reward across all validators in a given block.' +
        'This is not the direct reward, but base reward for Pallet staking module.' +
        'The minimum value must be greater than 450 tJOY based on current runtime.',
    stake: 1000,
    cancellationFee: 100,
    gracePeriod: 30,
    votingPeriod: 10000,
    approvalQuorum: 80,
    approvalThreshold: 80,
    slashingQuorum: 80,
    slashingThreshold: 80
  }
];

export default MockProposalTypesInfo;
