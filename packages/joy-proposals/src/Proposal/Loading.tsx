import React from "react";
import { Loader, Container } from "semantic-ui-react";

type LoadingProps = {
  text: string;
};

export default function Loading({ text }: LoadingProps) {
  return (
    <Container style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Loader active>{text}</Loader>
    </Container>
  );
}
