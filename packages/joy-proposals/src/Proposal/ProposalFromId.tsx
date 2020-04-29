import React from "react";
import { RouteComponentProps } from "react-router-dom";

import ProposalDetails from "./ProposalDetails";
import { useTransport, ParsedProposal } from "../runtime";
import { usePromise } from "../utils";
import Error from "./Error";
import Loading from "./Loading";
import NotDone from "../NotDone";

export default function ProposalFromId(props: RouteComponentProps<any>) {
  const {
    match: {
      params: { id }
    }
  } = props;
  const transport = useTransport();

  const [proposal, perror, ploading] = usePromise<ParsedProposal>(
    () => transport.proposalById(id),
    {} as ParsedProposal
  );
  const [votes, error, loading] = usePromise<any>(() => transport.votes(id), []);

  if (loading && !error) {
    return <Loading text="Fetching Proposal..." />;
  } else if (error) {
    return <Error error={error} />;
  }
  console.log({ proposal, perror, ploading });
  console.log({ votes, error, loading });

  return <NotDone {...props} />;
}
