import React from 'react';
import { getFormErrorLabelsProps } from './errorHandling';
import * as Yup from 'yup';
import {
  withProposalFormData,
  ProposalFormExportProps,
  ProposalFormContainerProps,
  ProposalFormInnerProps,
  genericFormDefaultOptions
} from './GenericProposalForm';
import {
  GenericWorkingGroupProposalForm,
  FormValues as WGFormValues,
  defaultValues as wgFromDefaultValues
} from './GenericWorkingGroupProposalForm';
import { InputFormField } from './FormFields';
import { withFormContainer } from './FormContainer';
import './forms.css';
import { Grid } from 'semantic-ui-react';
import { formatBalance } from '@polkadot/util';
import _ from 'lodash';
import Validation from '../validationSchema';

export type FormValues = WGFormValues & {
  capacity: string;
};

const defaultValues: FormValues = {
  ...wgFromDefaultValues,
  capacity: ''
};

type FormAdditionalProps = {}; // Aditional props coming all the way from export component into the inner form.
type ExportComponentProps = ProposalFormExportProps<FormAdditionalProps, FormValues>;
type FormContainerProps = ProposalFormContainerProps<ExportComponentProps>;
type FormInnerProps = ProposalFormInnerProps<FormContainerProps, FormValues>;

const SetWorkingGroupMintCapacityForm: React.FunctionComponent<FormInnerProps> = props => {
  const { handleChange, errors, touched, values, myMemberId } = props;
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);

  return (
    <GenericWorkingGroupProposalForm
      {...props}
      txMethod="createSetWorkingGroupMintCapacityProposal"
      proposalType="SetWorkingGroupMintCapacity"
      submitParams={[
        myMemberId,
        values.title,
        values.rationale,
        '{STAKE}',
        values.capacity,
        values.workingGroup
      ]}
    >
      <Grid columns="4" doubling stackable verticalAlign="bottom">
        <Grid.Column>
          <InputFormField
            label="Mint capacity"
            onChange={handleChange}
            name="capacity"
            error={errorLabelsProps.capacity}
            value={values.capacity}
            placeholder={'ie. 100000'}
            unit={formatBalance.getDefaults().unit}
          />
        </Grid.Column>
      </Grid>
    </GenericWorkingGroupProposalForm>
  );
};

const FormContainer = withFormContainer<FormContainerProps, FormValues>({
  mapPropsToValues: (props: FormContainerProps) => ({
    ...defaultValues,
    ...(props.initialData || {})
  }),
  validationSchema: Yup.object().shape({
    ...genericFormDefaultOptions.validationSchema,
    ...Validation.SetWorkingGroupMintCapacity()
  }),
  handleSubmit: genericFormDefaultOptions.handleSubmit,
  displayName: 'SetWorkingGroupMintCapacityForm'
})(SetWorkingGroupMintCapacityForm);

export default withProposalFormData<FormContainerProps, ExportComponentProps>(FormContainer);
