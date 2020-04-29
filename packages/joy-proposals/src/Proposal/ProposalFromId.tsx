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

  const [proposal, loading, error] = usePromise<ParsedProposal | null>(() => transport.proposalById(id), null);
  //const [votes, loadVotes, errorVote] = usePromise<any>(transport.votes(id), []);

  if (loading && !error) {
    return <Loading text="Fetching Proposal..." />;
  } else if (error || proposal === null) {
    return <Error error={error} />;
  }

  return <ProposalDetails proposal={ proposal as ParsedProposal } proposalId={id}/>;
}
