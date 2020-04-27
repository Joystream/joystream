import React from "react";
import { Header, Card } from "semantic-ui-react";

import { ProposalProps } from "./ProposalDetails";
import Details from "./Details";

import "./Proposal.css";

export default function ProposalPreview({ title, description, details }: ProposalProps) {
  return (
    <Card fluid className="Proposal">
      <Card.Content>
        <Card.Header>
          <Header as="h1">{title}</Header>
        </Card.Header>
        <Card.Description>{description}</Card.Description>
        <Details {...details} />
      </Card.Content>
    </Card>
  );
}
