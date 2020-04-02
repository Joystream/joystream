import React from "react";
import { Item, Image, Header } from "semantic-ui-react";

import { User } from "./ProposalDetails";

type DetailsProps = {
  // FIXME: Stage, substage and type all should be an enum
  stage?: string;
  substage?: string;
  expiresIn?: number;
  type?: string;
  createdBy?: User;
  createdAt?: string;
};

export default function Details({ stage, substage, createdAt, createdBy, type, expiresIn }: DetailsProps) {
  return (
    <Item.Group className="details-container">
      <Item>
        <Item.Content>
          <Item.Extra>Proposed By:</Item.Extra>
          <Image src={createdBy.avatar} avatar floated="left" />
          <Header as="h4">{createdBy.name}</Header>
          <Item.Extra>{createdAt}</Item.Extra>
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
          <Item.Extra>Substage:</Item.Extra>
          <Header as="h4">{substage}</Header>
        </Item.Content>
      </Item>
      <Item>
        <Item.Content>
          <Item.Extra>Expires in:</Item.Extra>
          <Header as="h4">{expiresIn}</Header>
        </Item.Content>
      </Item>
    </Item.Group>
  );
}
