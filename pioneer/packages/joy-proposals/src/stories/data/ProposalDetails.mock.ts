import { ParsedProposal } from '@polkadot/joy-utils/types/proposals';
import { ProposalId } from '@joystream/types/proposals';

const mockedProposal: ParsedProposal = {
  id: new ProposalId(100),
  title: 'Awesome Proposal',
  description: 'Please send me some tokens for coffee',
  createdAtBlock: 36,
  type: 'Text',
  details: ['Ciao'],
  parameters: {
    approvalQuorumPercentage: 66,
    approvalThresholdPercentage: 80,
    gracePeriod: 0,
    requiredStake: 101520,
    slashingQuorumPercentage: 60,
    slashingThresholdPercentage: 80,
    votingPeriod: 7200
  },
  proposerId: 303,
  status: {
    Active: {
      stakeId: 0,
      sourceAccountId: '5C4hrfkRjSLwQSFVtCvtbV6wctV1WFnkiexUZWLAh4Bc7jib'
    }
  },
  proposer: {
    about: 'Bob',
    avatar_uri: 'https://react.semantic-ui.com/images/avatar/large/steve.jpg',
    controller_account: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    handle: 'bob55',
    registered_at_block: 18,
    registered_at_time: 1588087314000,
    entry: {
      Paid: 0
    },
    root_account: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    subscription: null,
    suspended: false
  },
  votingResults: {
    abstensions: 3,
    approvals: 0,
    rejections: 1,
    slashes: 0
  },
  createdAt: new Date('Mar 25, 2020 at 14:20'),
  cancellationFee: 5
};

export default mockedProposal;
