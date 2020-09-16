import React from 'react';
import withMock from './withMock';

import MockProposalDetails from './data/ProposalDetails.mock';
import { ProposalDetails } from '../Proposal';

export default {
  title: 'Proposals | Details'
};

export const HasToVote = withMock(() => <ProposalDetails {...MockProposalDetails} />);

export const VotedApproved = withMock(() => (
  <ProposalDetails {...MockProposalDetails} vote={{ hasVoted: true, value: 'Approve' }} />
));

export const VotedAbstain = withMock(() => (
  <ProposalDetails {...MockProposalDetails} vote={{ hasVoted: true, value: 'Abstain' }} />
));

export const VotedReject = withMock(() => (
  <ProposalDetails {...MockProposalDetails} vote={{ hasVoted: true, value: 'Reject' }} />
));

export const VotedSlash = withMock(() => <ProposalDetails {...MockProposalDetails} vote={{ hasVoted: true, value: 'Slash' }} />);
