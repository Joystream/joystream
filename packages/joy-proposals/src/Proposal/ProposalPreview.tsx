import React from "react";
import { Header, Card } from "semantic-ui-react";
import Details from "./Details";
import { ParsedProposal } from "../runtime/transport";
import { getExtendedStatus } from "./ProposalDetails";
import { BlockNumber } from '@polkadot/types/interfaces';

import "./Proposal.css";

type ProposalPreviewProps = {
  proposal: ParsedProposal,
  bestNumber?: BlockNumber
};
export default function ProposalPreview({ proposal, bestNumber }: ProposalPreviewProps) {
  const extendedStatus = getExtendedStatus(proposal, bestNumber);
  return (
    <Card
      fluid
      className="Proposal"
      href={`#/proposals/${proposal.id}`}>
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
