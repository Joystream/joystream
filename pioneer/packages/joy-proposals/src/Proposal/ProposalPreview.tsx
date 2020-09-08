import React from 'react';
import { Header, Card } from 'semantic-ui-react';
import Details from './Details';
import { ParsedProposal } from '@polkadot/joy-utils/types/proposals';
import { getExtendedStatus } from './ProposalDetails';
import { BlockNumber } from '@polkadot/types/interfaces';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';

import './Proposal.css';

const ProposalIdBox = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  padding: 1rem;
  color: rgba(0,0,0,0.4);
  font-size: 1.1em;
`;

const ProposalDesc = styled.div`
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
`;

export type ProposalPreviewProps = {
  proposal: ParsedProposal;
  bestNumber?: BlockNumber;
};
export default function ProposalPreview ({ proposal, bestNumber }: ProposalPreviewProps) {
  const extendedStatus = getExtendedStatus(proposal, bestNumber);
  return (
    <Card
      fluid
      className="Proposal"
      href={`#/proposals/${proposal.id}`}>
      <ProposalIdBox>{ `#${proposal.id.toString()}` }</ProposalIdBox>
      <Card.Content>
        <Card.Header>
          <Header as="h1">{proposal.title}</Header>
        </Card.Header>
        <Card.Description>
          <ProposalDesc>
            <ReactMarkdown source={proposal.description} linkTarget='_blank' />
          </ProposalDesc>
        </Card.Description>
        <Details proposal={proposal} extendedStatus={extendedStatus} />
      </Card.Content>
    </Card>
  );
}
