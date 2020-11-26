import React, { useState, useEffect } from 'react';
import { getFormErrorLabelsProps } from './errorHandling';
import * as Yup from 'yup';
import { withProposalFormData,
  ProposalFormExportProps,
  ProposalFormContainerProps,
  ProposalFormInnerProps } from './GenericProposalForm';
import { GenericWorkingGroupProposalForm,
  FormValues as WGFormValues,
  defaultValues as wgFromDefaultValues } from './GenericWorkingGroupProposalForm';
import { InputFormField } from './FormFields';
import { withFormContainer } from './FormContainer';
import { Grid } from 'semantic-ui-react';
import { formatBalance } from '@polkadot/util';
import _ from 'lodash';
import Validation from '../validationSchema';
import { WorkerData } from '@polkadot/joy-utils/types/workingGroups';

export type FormValues = WGFormValues & {
  amount: string;
};

const defaultValues: FormValues = {
  ...wgFromDefaultValues,
  amount: ''
};

type FormAdditionalProps = Record<any, never>; // Aditional props coming all the way from export component into the inner form.
type ExportComponentProps = ProposalFormExportProps<FormAdditionalProps, FormValues>;
type FormContainerProps = ProposalFormContainerProps<ExportComponentProps>;
type FormInnerProps = ProposalFormInnerProps<FormContainerProps, FormValues>;

const SlashWorkingGroupLeadStakeForm: React.FunctionComponent<FormInnerProps> = (props) => {
  const { handleChange, errors, touched, values, setFieldError } = props;
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  const [lead, setLead] = useState<WorkerData | null>(null);

  // Here we validate if stake <= current lead stake.
  // Because it depends on selected working group,
  // there's no easy way to do it using validationSchema
  useEffect(() => {
    if (lead && parseInt(values.amount) > (lead.stake || 0) && !errors.amount) {
      setFieldError('amount', `The stake cannot exceed current leader's stake (${formatBalance(lead.stake)})`);
    }
  });

  return (
    <GenericWorkingGroupProposalForm
      {...props}
      txMethod='createSlashWorkingGroupLeaderStakeProposal'
      proposalType='SlashWorkingGroupLeaderStake'
      leadRequired={true}
      leadStakeRequired={true}
      onLeadChange={(lead: WorkerData | null) => setLead(lead)}
      submitParams={[
        lead?.workerId,
        values.amount,
        values.workingGroup
      ]}
    >
      { (lead && lead.stake) && (
        <Grid columns='4' doubling stackable verticalAlign='bottom'>
          <Grid.Column>
            <InputFormField
              label='Amount to slash'
              onChange={handleChange}
              name='amount'
              error={errorLabelsProps.amount}
              value={values.amount}
              unit={formatBalance.getDefaults().unit}
            />
          </Grid.Column>
        </Grid>
      ) }
    </GenericWorkingGroupProposalForm>
  );
};

const FormContainer = withFormContainer<FormContainerProps, FormValues>({
  mapPropsToValues: (props: FormContainerProps) => ({
    ...defaultValues,
    ...(props.initialData || {})
  }),
  validationSchema: Yup.object().shape({
    ...Validation.All(),
    ...Validation.SlashWorkingGroupLeaderStake()
  }),
  handleSubmit: () => null,
  displayName: 'SlashWorkingGroupLeadStakeForm'
})(SlashWorkingGroupLeadStakeForm);

export default withProposalFormData<FormContainerProps, ExportComponentProps>(FormContainer);
