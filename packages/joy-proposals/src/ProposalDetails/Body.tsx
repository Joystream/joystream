import React from "react";
import { Card, Header, Item } from "semantic-ui-react";

type BodyProps = {
  title?: string;
  description?: string;
  params?: {
    tokensAmount?: number;
    destinationAccount?: string;
  };
};

export default function Body({ title, description, params }: BodyProps) {
  return (
    <Card fluid>
      <Card.Content>
        <Card.Header>
          <Header as="h1">{title}</Header>
        </Card.Header>
        <Card.Description>{description}</Card.Description>
        <Header as="h4">Parameters:</Header>
        <Item.Group textAlign="left" relaxed>
          <Item>
            <Item.Content>
              <span className="text-grey">Amount of tokens: </span>
              {`${params.tokensAmount} tJOY`}
            </Item.Content>
          </Item>
          <Item>
            <Item.Content>
              <span className="text-grey">Destination account: </span>
              {params.destinationAccount}
            </Item.Content>
          </Item>
        </Item.Group>
      </Card.Content>
    </Card>
  );
}
