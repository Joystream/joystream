import React from 'react';
import { default as MintCapacityForm } from './MintCapacityForm';
import { RouteComponentProps } from 'react-router';

const ContentWorkingGroupMintCapForm = (props: RouteComponentProps) => (
    <MintCapacityForm
      mintCapacityGroup="Content Working Group"
      txMethod="createSetContentWorkingGroupMintCapacityProposal"
      {...props} />
);

export default ContentWorkingGroupMintCapForm;
