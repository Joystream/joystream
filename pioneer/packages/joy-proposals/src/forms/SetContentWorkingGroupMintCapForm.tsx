import React from 'react';
import { default as MintCapacityForm } from './MintCapacityForm';
import { RouteComponentProps } from 'react-router';
import { useTransport, usePromise } from '@polkadot/joy-utils/react/hooks';
import { PromiseComponent } from '@polkadot/joy-utils/react/components';

const ContentWorkingGroupMintCapForm = (props: RouteComponentProps) => {
  const transport = useTransport();
  const [mintCapacity, error, loading] = usePromise<number>(() => transport.contentWorkingGroup.currentMintCap(), 0);

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
