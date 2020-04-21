import React from 'react';
import { default as MintCapacityForm } from './MintCapacityForm';
import { genericFormDefaultOptions } from './GenericProposalForm';

const CouncilMintCapForm = () => (
    <MintCapacityForm
      mintCapacityGroup="Council"
      handleSubmit={ genericFormDefaultOptions.handleSubmit }/>
);

export default CouncilMintCapForm;
