import React, { useState } from 'react';
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
import { withFormContainer } from './FormContainer';
import './forms.css';
import _ from 'lodash';
import Validation from '../validationSchema';
import { WorkerData } from '@polkadot/joy-utils/types/workingGroups';
import { getFormErrorLabelsProps } from './errorHandling';
import FormField, { TextareaFormField } from './FormFields';
import { Checkbox } from 'semantic-ui-react';
import { TerminateRoleParameters } from '@joystream/types/proposals';
import { WorkerId } from '@joystream/types/working-group';
import { Bytes } from '@polkadot/types';
import { WorkingGroup, InputValidationLengthConstraint } from '@joystream/types/common';
import { bool as Bool } from '@polkadot/types/primitive';
import { withCalls } from '@polkadot/react-api';
import { formatBalance } from '@polkadot/util';

export type FormValues = WGFormValues & {
  terminationRationale: string;
  slashStake: boolean;
};

const defaultValues: FormValues = {
  ...wgFromDefaultValues,
  terminationRationale: '',
  slashStake: false
};

type FormAdditionalProps = {}; // Aditional props coming all the way from export component into the inner form.
type ExportComponentProps = ProposalFormExportProps<FormAdditionalProps, FormValues>;
type FormContainerProps = ProposalFormContainerProps<ExportComponentProps> & {
  terminationRationaleConstraint?: InputValidationLengthConstraint;
};
type FormInnerProps = ProposalFormInnerProps<FormContainerProps, FormValues>;

const valuesToTerminateRoleParams = (values: FormValues, lead: WorkerData): TerminateRoleParameters => {
  return new TerminateRoleParameters({
    worker_id: new WorkerId(lead.workerId),
    rationale: new Bytes(values.terminationRationale),
    slash: lead.stake ? new Bool(values.slashStake) : new Bool(false),
    working_group: new WorkingGroup(values.workingGroup)
  });
};

const TerminateWorkingGroupLeaderForm: React.FunctionComponent<FormInnerProps> = props => {
  const { handleChange, errors, touched, values, myMemberId, setFieldValue } = props;
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  const [lead, setLead] = useState<WorkerData | null>(null);

  return (
    <GenericWorkingGroupProposalForm
      {...props}
      txMethod="createTerminateWorkingGroupLeaderRoleProposal"
      proposalType="TerminateWorkingGroupLeaderRole"
      leadRequired={true}
      onLeadChange={(lead: WorkerData | null) => setLead(lead)}
      submitParams={[
        myMemberId,
        values.title,
        values.rationale,
        '{STAKE}',
        lead && valuesToTerminateRoleParams(values, lead)
      ]}
    >
      { lead && (<>
        <TextareaFormField
          label="Termination rationale"
          help={
            'This rationale is an required argument of "terminateWorkerRole" extrinsic, ' +
            'it may differ from proposal rationale and has different length constraints. ' +
            'If the propsal gets executed, this rationale will become part of "TerminatedLeader" event.'
          }
          onChange={handleChange}
          name="terminationRationale"
          placeholder="Provide a clear rationale for terminating the leader role..."
          error={errorLabelsProps.terminationRationale}
          value={values.terminationRationale}
        />
        { lead.stake && (
          <FormField>
            <Checkbox
              toggle
              onChange={(e, data) => { setFieldValue('slashStake', data.checked); }}
              label={ `Slash leader stake (${formatBalance(lead.stake)})` }
              checked={values.slashStake}/>
          </FormField>
        ) }
      </>) }
    </GenericWorkingGroupProposalForm>
  );
};

const FormContainer = withFormContainer<FormContainerProps, FormValues>({
  mapPropsToValues: (props: FormContainerProps) => ({
    ...defaultValues,
    ...(props.initialData || {})
  }),
  validationSchema: (props: FormContainerProps) => Yup.object().shape({
    ...genericFormDefaultOptions.validationSchema,
    ...Validation.TerminateWorkingGroupLeaderRole(
      props.terminationRationaleConstraint || InputValidationLengthConstraint.createWithMaxAllowed()
    )
  }),
  handleSubmit: genericFormDefaultOptions.handleSubmit,
  displayName: 'TerminateWorkingGroupLeaderForm'
})(TerminateWorkingGroupLeaderForm);

export default withCalls<ExportComponentProps>(
  ['query.storageWorkingGroup.workerExitRationaleText', { propName: 'terminationRationaleConstraint' }]
)(
  withProposalFormData<FormContainerProps, ExportComponentProps>(FormContainer)
);
