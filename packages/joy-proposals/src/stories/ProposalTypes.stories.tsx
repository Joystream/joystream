import React from 'react';
import '../index.css';
import { ProposalTypeSelector } from '../ProposalTypeSelector';
import { MockProposalTypes } from './data/MockProposalTypes';

export default { 
	title: 'Proposals | Proposals types',
};

export const ProposalTypes = () =>
	<ProposalTypeSelector types={MockProposalTypes} />
