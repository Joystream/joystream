import React from "react";
import { Card, Header, List } from "semantic-ui-react";

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
        <List textAlign="left" relaxed>
          <List.Item>
            <List.Content className="text-secondary" content="Amount of tokens:" />
            <List.Content content={`${params.tokensAmount} tJOY`} />
          </List.Item>
          <List.Item>
            <List.Content className="text-secondary" content="Destination Account:" />
            <List.Content content={params.destinationAccount} />
          </List.Item>
        </List>
      </Card.Content>
    </Card>
  );
}
