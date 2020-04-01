import React from "react";

import { Divider, Container, Header, Button, Icon } from "semantic-ui-react";
import Votes from "./Votes";
import Details from "./Details";
import Body from "./Body";

export type User = {
  name?: string;
  avatar?: string;
};
export type Vote = {
  value?: "Approve" | "Slash" | "Abstain" | "Reject";
  by?: User;
  createdAt?: string;
};

export type ProposalProps = {
  title?: string;
  description?: string;
  params?: {
    tokensAmount?: number;
    destinationAccount?: string;
  };
  votes?: Vote[];
  totalVotes?: number;
  details?: {
    // FIXME: Stage, substage and type all should be an enum
    stage?: string;
    substage?: string;
    expiresIn?: number;
    type?: string;
    createdBy?: User;
    createdAt?: string;
  };
};

export default function ProposalDetails({ title, description, params, details, votes, totalVotes }: ProposalProps) {
  return (
    <Container>
      <Details {...details} />
      <Body title={title} description={description} params={params} />
      <Header as="h3">Submit your vote</Header>
      <Divider />
      <>
        <Button color="green" icon labelPosition="left">
          <Icon name="smile" inverted />
          Approve
        </Button>
        <Button color="grey" icon labelPosition="left">
          <Icon name="meh" inverted />
          Abstain
        </Button>
        <Button color="orange" icon labelPosition="left">
          <Icon name="frown" inverted />
          Reject
        </Button>
        <Button color="red" icon labelPosition="left">
          <Icon name="times" inverted />
          Slash
        </Button>
      </>
      <Votes votes={votes} total={totalVotes} />
    </Container>
  );
}
