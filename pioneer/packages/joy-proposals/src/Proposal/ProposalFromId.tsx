import React from "react";
import { RouteComponentProps } from "react-router-dom";
import ProposalDetails from "./ProposalDetails";
import { useProposalSubscription } from "../utils";
import Error from "./Error";
import Loading from "./Loading";


export default function ProposalFromId(props: RouteComponentProps<any>) {
  const {
    match: {
      params: { id }
    }
  } = props;

  const { proposal: proposalState, votes: votesState } = useProposalSubscription(id);

  if (proposalState.loading && !proposalState.error) {
    return <Loading text="Fetching Proposal..." />;
  } else if (proposalState.error) {
    return <Error error={proposalState.error} />;
  }

  return <ProposalDetails proposal={ proposalState.data } proposalId={ id } votesListState={ votesState }/>;
}
