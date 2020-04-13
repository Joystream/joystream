import React from 'react';
import '../index.css';

import MockProposalDetails from './data/ProposalDetails.mock';
import { ProposalDetails } from '../Proposal';

export default {
  title: 'Proposals | Details'
};

export const HasToVote = () => <ProposalDetails {...MockProposalDetails} />;

export const VotedApproved = () => (
  <ProposalDetails {...MockProposalDetails} vote={{ hasVoted: true, value: 'Approve' }} />
);

export const VotedAbstain = () => (
  <ProposalDetails {...MockProposalDetails} vote={{ hasVoted: true, value: 'Abstain' }} />
);

export const VotedReject = () => (
  <ProposalDetails {...MockProposalDetails} vote={{ hasVoted: true, value: 'Reject' }} />
);

export const VotedSlash = () => <ProposalDetails {...MockProposalDetails} vote={{ hasVoted: true, value: 'Slash' }} />;
