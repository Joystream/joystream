import React from 'react';
import '../index.css';
import { ProposalTypeSelector } from '../ProposalTypeSelector';
import { MockProposalTypes } from './data/MockProposalTypes';

export default { 
	title: 'Proposals | Types',
};

export const ProposalTypes = () =>
	<ProposalTypeSelector types={MockProposalTypes} />
