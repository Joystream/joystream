import { ProposalProps } from '../../Proposal/ProposalDetails';

const mockedProposal: ProposalProps = {
  title: 'Send me some tokens for coffee',
  description:
    'Change the total reward across all validators in a given block. This is not the direct reward, but base reward for Pallet staking module. The minimum value must be greater than 450 tJOY based on current runtime. Also, coffee is getting expensive.',
  params: {
    tokensAmount: 123.45,
    destinationAccount: '0x4977CA8ADB17758aD2eac7220CE0C21D46421BB7'
  },
  details: {
    createdBy: {
      name: 'Satoshi',
      avatar: 'https://react.semantic-ui.com/images/avatar/large/steve.jpg'
    },
    stage: 'Active',
    createdAt: 'Mar 25, 2020 at 14:20',
    type: 'Spending Proposal',
    substage: 'Grace period',
    expiresIn: 5678
  },
  votes: [
    {
      value: 'Approve',
      by: {
        name: 'Alice Ellison',
        avatar: 'https://react.semantic-ui.com/images/avatar/large/jenny.jpg'
      },
      createdAt: 'Mar 25, 2020 at 14:20'
    },
    {
      value: 'Abstain',
      by: {
        name: 'Bob Bobston',
        avatar: 'https://react.semantic-ui.com/images/avatar/large/daniel.jpg'
      },
      createdAt: 'Mar 24, 2020 at 12:11'
    },
    {
      value: 'Reject',
      by: {
        name: 'Charlie Chen',
        avatar: 'https://react.semantic-ui.com/images/avatar/large/matthew.png'
      },
      createdAt: 'Mar 23, 2020 at 11:34'
    },
    {
      value: 'Slash',
      by: {
        name: 'David Douglas',
        avatar: 'https://react.semantic-ui.com/images/avatar/large/elliot.jpg'
      },
      createdAt: 'Mar 21, 2020 at 9:54'
    }
  ],
  totalVotes: 12
};

export default mockedProposal;
