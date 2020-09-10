import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import ProposalDetails from './ProposalDetails';
import { useProposalSubscription } from '@polkadot/joy-utils/react/hooks';
import PromiseComponent from '@polkadot/joy-utils/react/components/PromiseComponent';
import { useApi } from '@polkadot/react-hooks';

type RouteParams = { id?: string | undefined };

export default function ProposalFromId (props: RouteComponentProps<RouteParams>) {
  const {
    match: {
      params: { id }
    }
  } = props;
  const { api } = useApi();

  const proposalState = useProposalSubscription(api.createType('ProposalId', id));

  return (
    <PromiseComponent
      error={proposalState.error}
      loading={proposalState.loading}
      message={'Fetching proposal...'}>
      <ProposalDetails proposal={ proposalState.data } proposalId={ id }/>
    </PromiseComponent>
  );
}
