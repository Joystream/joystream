import React from 'react';
import * as Yup from 'yup';
import { getFormErrorLabelsProps } from './errorHandling';
import {
  GenericProposalForm,
  GenericFormValues,
  genericFormDefaultOptions,
  genericFormDefaultValues,
  withProposalFormData,
  ProposalFormExportProps,
  ProposalFormContainerProps,
  ProposalFormInnerProps
} from './GenericProposalForm';
import Validation from '../validationSchema';
import { InputFormField } from './FormFields';
import { withFormContainer } from './FormContainer';
import { ProposalType } from '@polkadot/joy-utils/types/proposals';
import { formatBalance } from '@polkadot/util';
import './forms.css';

export type FormValues = GenericFormValues & {
  capacity: string;
};

const defaultValues: FormValues = {
  ...genericFormDefaultValues,
  capacity: ''
};

type MintCapacityGroup = 'Council' | 'Content Working Group';

// Aditional props coming all the way from export comonent into the inner form.
type FormAdditionalProps = {
  mintCapacityGroup: MintCapacityGroup;
  txMethod: string;
  proposalType: ProposalType;
};
type ExportComponentProps = ProposalFormExportProps<FormAdditionalProps, FormValues>;
type FormContainerProps = ProposalFormContainerProps<ExportComponentProps>;
type FormInnerProps = ProposalFormInnerProps<FormContainerProps, FormValues>;

const MintCapacityForm: React.FunctionComponent<FormInnerProps> = props => {
  const { handleChange, errors, touched, mintCapacityGroup, values, txMethod, initialData, proposalType } = props;
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  return (
    <GenericProposalForm
      {...props}
      txMethod={txMethod}
      proposalType={proposalType}
      submitParams={[props.myMemberId, values.title, values.rationale, '{STAKE}', values.capacity]}
    >
      <InputFormField
        error={errorLabelsProps.capacity}
        onChange={handleChange}
        name="capacity"
        placeholder={ (initialData && initialData.capacity) }
        label={`${mintCapacityGroup} Mint Capacity`}
        help={`The new mint capacity you propse for ${mintCapacityGroup}`}
        unit={ formatBalance.getDefaults().unit }
        value={values.capacity}
      />
    </GenericProposalForm>
  );
};

const FormContainer = withFormContainer<FormContainerProps, FormValues>({
  mapPropsToValues: (props: FormContainerProps) => ({
    ...defaultValues,
    ...(props.initialData || {})
  }),
  validationSchema: Yup.object().shape({
    ...genericFormDefaultOptions.validationSchema,
    ...Validation.SetContentWorkingGroupMintCapacity()
  }),
  handleSubmit: genericFormDefaultOptions.handleSubmit,
  displayName: 'MintCapacityForm'
})(MintCapacityForm);

export default withProposalFormData<FormContainerProps, ExportComponentProps>(FormContainer);
