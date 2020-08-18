import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import ProposalDetails from './ProposalDetails';
import { useProposalSubscription } from '@polkadot/joy-utils/react/hooks';
import PromiseComponent from '@polkadot/joy-utils/react/components/PromiseComponent';
import { useApi } from '@polkadot/react-hooks';

export default function ProposalFromId (props: RouteComponentProps<any>) {
  const {
    match: {
      params: { id }
    }
  } = props;
  const { api } = useApi();

  const { proposal: proposalState, votes: votesState } = useProposalSubscription(api.createType('ProposalId', id));

  return (
    <PromiseComponent
      error={proposalState.error}
      loading={proposalState.loading}
      message={'Fetching proposal...'}>
      <ProposalDetails proposal={ proposalState.data } proposalId={ id } votesListState={ votesState }/>
    </PromiseComponent>
  );
}
