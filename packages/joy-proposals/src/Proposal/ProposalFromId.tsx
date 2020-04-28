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

  const [proposal, loading, error] = usePromise<any>(transport.proposalById(id), {});

  if (loading && !error) {
    return <Loading text="Fetching Proposal..." />;
  } else if (error) {
    return <Error error={error} />;
  }
  console.log(`With ${id} we fetched proposal...`);
  console.log(proposal);

  return <NotDone {...props} />;
}
