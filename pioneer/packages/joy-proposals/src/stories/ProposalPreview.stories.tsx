import React from 'react';
import MockProposalPreview from './data/ProposalPreview.mock';
import { ProposalPreview } from '../Proposal';
import withMock from './withMock';

export default {
  title: 'Proposals | Preview'
};

export const Default = withMock(() => <ProposalPreview {...MockProposalPreview} />);
