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
      <Item className="details-item">
        <Item.Content className="text-secondary">Proposed By:</Item.Content>
        <Item.Content verticalAlign="top">
          <Image avatar src={createdBy.avatar} floated="left" />
          <Header as="h4">{createdBy.name}</Header>
          <Item.Extra className="text-secondary">{createdAt}</Item.Extra>
        </Item.Content>
      </Item>
      <Item className="details-item">
        <Item.Content className="text-secondary">Proposal Type:</Item.Content>
        <Item.Content verticalAlign="top">
          <Header as="h4">{type}</Header>
        </Item.Content>
      </Item>
      <Item className="details-item">
        <Item.Content className="text-secondary">Stage:</Item.Content>
        <Item.Content verticalAlign="top">
          <Header as="h4">{stage}</Header>
        </Item.Content>
      </Item>
      <Item className="details-item">
        <Item.Content className="text-secondary">Substage:</Item.Content>
        <Item.Content>
          <Header as="h4">{substage}</Header>
        </Item.Content>
      </Item>
      <Item className="details-item">
        <Item.Content className="text-secondary">Expires in:</Item.Content>
        <Item.Content verticalAlign="top">
          <Header as="h4">{expiresIn}</Header>
        </Item.Content>
      </Item>
    </Item.Group>
  );
}
