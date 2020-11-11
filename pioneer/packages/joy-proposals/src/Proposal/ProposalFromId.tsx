import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import ProposalDetails from './ProposalDetails';
import { usePromise, useProposalSubscription, useTransport } from '@polkadot/joy-utils/react/hooks';
import PromiseComponent from '@polkadot/joy-utils/react/components/PromiseComponent';
import { useApi } from '@polkadot/react-hooks';
import { ParsedProposal } from '@polkadot/joy-utils/types/proposals';

type RouteParams = { id?: string | undefined };

export function HistoricalProposalFromId (props: RouteComponentProps<RouteParams>) {
  const {
    match: {
      params: { id }
    }
  } = props;
  const { api } = useApi();

  const transport = useTransport();
  const [proposal, error, loading] = usePromise(
    () => transport.proposals.historicalProposalById(api.createType('ProposalId', id)),
    null as ParsedProposal | null
  );

  return (
    <PromiseComponent
      error={error}
      loading={loading}
      message={'Fetching proposal...'}>
      <ProposalDetails proposal={ proposal } proposalId={ id } historical/>
    </PromiseComponent>
  );
}

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
