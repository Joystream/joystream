import React from "react";
import { RouteComponentProps } from "react-router-dom";

import ProposalDetails from "./ProposalDetails";
import { useTransport, SubstrateTransport } from "../runtime";
import { usePromise } from "../utils";
import Error from "./Error";
import Loading from "./Loading";

export default function ProposalFromId(props: RouteComponentProps<any>) {
  const {
    match: {
      params: { id }
    }
  } = props;
  console.log(`This is ID: ${id} bleeep bloop 🤖`);
  let transport = useTransport() as SubstrateTransport;
  console.log("THIS IS THE CONTEXT INSIDE OF PROPOSAL PREVIEW LIST BLEEP BLOOP 🤖");
  let [proposal, loading, error] = usePromise<any>(transport.proposalById(id), {});

  if (loading && !error) {
    return <Loading text="Fetching Proposal..." />;
  } else if (error) {
    return <Error error={error} />;
  }

  return <ProposalDetails {...proposal} />;
}
