import React from "react";

import { Divider, Container } from "semantic-ui-react";

type User = {
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
  return;
  <Container>
    <Details details={details} />
    <Divider />
    <Votes votes={votes} total={totalVotes} />
  </Container>;
}
