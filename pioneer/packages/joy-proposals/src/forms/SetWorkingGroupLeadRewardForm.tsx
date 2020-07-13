import React, { useState } from 'react';
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
import { WorkerData } from '@polkadot/joy-utils/types/workingGroups';

export type FormValues = WGFormValues & {
  amount: string;
};

const defaultValues: FormValues = {
  ...wgFromDefaultValues,
  amount: ''
};

type FormAdditionalProps = {}; // Aditional props coming all the way from export component into the inner form.
type ExportComponentProps = ProposalFormExportProps<FormAdditionalProps, FormValues>;
type FormContainerProps = ProposalFormContainerProps<ExportComponentProps>;
type FormInnerProps = ProposalFormInnerProps<FormContainerProps, FormValues>;

const SetWorkingGroupLeadRewardForm: React.FunctionComponent<FormInnerProps> = props => {
  const { handleChange, errors, touched, values, myMemberId } = props;
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  const [lead, setLead] = useState<WorkerData | null>(null);

  return (
    <GenericWorkingGroupProposalForm
      {...props}
      txMethod="createSetWorkingGroupLeaderRewardProposal"
      proposalType="SetWorkingGroupLeaderReward"
      leadRequired={true}
      leadRewardRequired={true}
      onLeadChange={(lead: WorkerData | null) => setLead(lead)}
      submitParams={[
        myMemberId,
        values.title,
        values.rationale,
        '{STAKE}',
        lead?.workerId,
        values.amount,
        values.workingGroup
      ]}
    >
      { (lead && lead.reward) && (
        <Grid columns="4" doubling stackable verticalAlign="bottom">
          <Grid.Column>
            <InputFormField
              label="New reward amount"
              onChange={handleChange}
              name="amount"
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
    ...genericFormDefaultOptions.validationSchema,
    ...Validation.SetWorkingGroupLeaderReward()
  }),
  handleSubmit: genericFormDefaultOptions.handleSubmit,
  displayName: 'SetWorkingGroupLeadRewardForm'
})(SetWorkingGroupLeadRewardForm);

export default withProposalFormData<FormContainerProps, ExportComponentProps>(FormContainer);
