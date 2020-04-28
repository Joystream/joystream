import React from "react";
import { Item, Image, Header } from "semantic-ui-react";

import { ParsedProposal } from "../runtime";

export type DetailsProps = {
  proposal: ParsedProposal;
};

export default function Details({ proposal }: DetailsProps) {
  const expiresIn = proposal.parameters.votingPeriod - proposal.createdAtBlock;
  return (
    <Item.Group className="details-container">
      <Item>
        <Item.Content>
          <Item.Extra>Proposed By:</Item.Extra>
          <Image src={proposal.proposer.avatar_uri} avatar floated="left" />
          <Header as="h4">{proposal.proposer.about}</Header>
          <Item.Extra>{proposal.createdAt.toUTCString()}</Item.Extra>
        </Item.Content>
      </Item>
      <Item>
        <Item.Content>
          <Item.Extra>Proposal Type:</Item.Extra>
          <Header as="h4">{proposal.type}</Header>
        </Item.Content>
      </Item>
      <Item>
        <Item.Content>
          <Item.Extra>Stage:</Item.Extra>
          <Header as="h4">{Object.keys(proposal.status)[0]}</Header>
        </Item.Content>
      </Item>
      <Item>
        <Item.Content>
          <Item.Extra>Expires in:</Item.Extra>
          <Header as="h4">{`${expiresIn.toLocaleString("en-US")} blocks`}</Header>
        </Item.Content>
      </Item>
    </Item.Group>
  );
}
