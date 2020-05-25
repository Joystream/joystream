import React from 'react';
import { default as MintCapacityForm } from './MintCapacityForm';
import { RouteComponentProps } from 'react-router';
import { useTransport } from "../runtime";
import { usePromise } from "../utils";
import PromiseComponent from '../Proposal/PromiseComponent';

const ContentWorkingGroupMintCapForm = (props: RouteComponentProps) => {
  const transport = useTransport();
  const [ mintCapacity, error, loading ] = usePromise<number>(() => transport.WGMintCap(), 0);

  return (
    <PromiseComponent error={error} loading={loading} message="Fetching current mint capacity...">
      <MintCapacityForm
        mintCapacityGroup="Content Working Group"
        txMethod="createSetContentWorkingGroupMintCapacityProposal"
        proposalType="SetContentWorkingGroupMintCapacity"
        initialData={{ capacity: mintCapacity.toString() }}
        {...props} />
    </PromiseComponent>
  );
};

export default ContentWorkingGroupMintCapForm;
