import React from 'react';
import '../index.css';

import MockProposalPreview from './data/ProposalPreview.mock';
import { ProposalPreview } from '../Proposal';

export default {
  title: 'Proposals | Preview'
};

export const Default = () => <ProposalPreview {...MockProposalPreview} />;
