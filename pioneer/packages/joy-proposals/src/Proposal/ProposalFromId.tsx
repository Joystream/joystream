import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import ProposalDetails from './ProposalDetails';
import { useProposalSubscription } from '@polkadot/joy-utils/react/hooks';
import { PromiseComponent } from '@polkadot/joy-utils/react/components';
import { ProposalId } from '@joystream/types/proposals';

export default function ProposalFromId (props: RouteComponentProps<any>) {
  const {
    match: {
      params: { id }
    }
  } = props;

  const { proposal: proposalState, votes: votesState } = useProposalSubscription(new ProposalId(id));

  return (
    <PromiseComponent
      error={proposalState.error}
      loading={proposalState.loading}
      message={'Fetching proposal...'}>
      <ProposalDetails proposal={ proposalState.data } proposalId={ id } votesListState={ votesState }/>
    </PromiseComponent>
  );
}
