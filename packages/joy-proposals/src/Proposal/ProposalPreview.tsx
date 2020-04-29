import React from "react";
import { Header, Card } from "semantic-ui-react";
import Details from "./Details";
import { ParsedProposal } from "../runtime/transport"

import "./Proposal.css";

type ProposalPreviewProps = {
  proposal: ParsedProposal
};
export default function ProposalPreview({ proposal }: ProposalPreviewProps) {
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
        <Details proposal={proposal} />
      </Card.Content>
    </Card>
  );
}
