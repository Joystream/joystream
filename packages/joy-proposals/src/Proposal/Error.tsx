import React from "react";
import { Container, Message } from "semantic-ui-react";

type ErrorProps = {
  error: any;
};
export default function Error({ error }: ErrorProps) {
  return (
    <Container style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Message negative>
        <Message.Header>Oops! We got an error!</Message.Header>
        <p>{error}</p>
      </Message>
    </Container>
  );
}
