import React from 'react';
import { Header, Card } from 'semantic-ui-react';
import Details from './Details';
import { ParsedProposal } from '@polkadot/joy-utils/types/proposals';
import { getExtendedStatus } from './ProposalDetails';
import { BlockNumber } from '@polkadot/types/interfaces';
import styled from 'styled-components';

import './Proposal.css';

const ProposalIdBox = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  padding: 1rem;
  color: rgba(0,0,0,0.4);
  font-size: 1.1em;
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
        <Card.Description>{proposal.description}</Card.Description>
        <Details proposal={proposal} extendedStatus={extendedStatus} />
      </Card.Content>
    </Card>
  );
}
