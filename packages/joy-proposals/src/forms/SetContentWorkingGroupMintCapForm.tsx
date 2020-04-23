import React from 'react';
import { default as MintCapacityForm } from './MintCapacityForm';
import { genericFormDefaultOptions } from './GenericProposalForm';

const ContentWorkingGroupMintCapForm = () => (
    <MintCapacityForm
      mintCapacityGroup="Content Working Group"
      handleSubmit={ genericFormDefaultOptions.handleSubmit }/>
);

export default ContentWorkingGroupMintCapForm;
