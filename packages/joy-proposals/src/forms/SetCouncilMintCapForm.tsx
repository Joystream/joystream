import React from 'react';
import { default as MintCapacityForm } from './MintCapacityForm';
import { RouteComponentProps } from 'react-router';

const CouncilMintCapForm = (props: RouteComponentProps) => (
    <MintCapacityForm
      mintCapacityGroup="Council"
      txMethod="createSetContentWorkingGroupMintCapacityProposal"
      {...props} />
);

export default CouncilMintCapForm;
