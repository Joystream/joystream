import React from "react";
import { RouteComponentProps } from "react-router-dom";

import ProposalDetails from "./ProposalDetails";
import { useTransport, ParsedProposal } from "../runtime";
import { usePromise } from "../utils";
import Error from "./Error";
import Loading from "./Loading";

export default function ProposalFromId(props: RouteComponentProps<any>) {
  const {
    match: {
      params: { id }
    }
  } = props;
  const transport = useTransport();

  const [proposal, error, loading] = usePromise<ParsedProposal>(
    () => transport.proposalById(id),
    {} as ParsedProposal
  );

  if (loading && !error) {
    return <Loading text="Fetching Proposal..." />;
  } else if (error) {
    return <Error error={error} />;
  }

  return <ProposalDetails proposal={ proposal } proposalId={id}/>;
}
