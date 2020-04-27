import React from "react";
import { Item, Image, Header } from "semantic-ui-react";

import { ProposalType } from "./ProposalTypePreview";

type Proposer = {
  about: string;
  handle: string;
  avatar_uri: string;
};

export type DetailsProps = {
  stage: string;
  expiresIn: number;
  type: ProposalType;
  createdBy: Proposer;
  createdAt: Date;
};

export default function Details({ stage, createdAt, createdBy, type, expiresIn }: DetailsProps) {
  return (
    <Item.Group className="details-container">
      <Item>
        <Item.Content>
          <Item.Extra>Proposed By:</Item.Extra>
          <Image src={createdBy.avatar_uri} avatar floated="left" />
          <Header as="h4">{createdBy.about}</Header>
          <Item.Extra>{createdAt.toUTCString()}</Item.Extra>
        </Item.Content>
      </Item>
      <Item>
        <Item.Content>
          <Item.Extra>Proposal Type:</Item.Extra>
          <Header as="h4">{type}</Header>
        </Item.Content>
      </Item>
      <Item>
        <Item.Content>
          <Item.Extra>Stage:</Item.Extra>
          <Header as="h4">{stage}</Header>
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
