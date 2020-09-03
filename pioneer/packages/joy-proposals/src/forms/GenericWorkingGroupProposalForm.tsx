import React from 'react';
import { getFormErrorLabelsProps } from './errorHandling';
import {
  GenericProposalForm,
  GenericFormValues,
  genericFormDefaultValues,
  ProposalFormExportProps,
  ProposalFormContainerProps,
  ProposalFormInnerProps
} from './GenericProposalForm';
import { FormField } from './FormFields';
import { ProposalType } from '@polkadot/joy-utils/types/proposals';
import { WorkingGroupKey, WorkingGroupDef } from '@joystream/types/common';
import './forms.css';
import { Dropdown, Message } from 'semantic-ui-react';
import { usePromise, useTransport } from '@polkadot/joy-utils/react/hooks';
import { PromiseComponent } from '@polkadot/joy-utils/react/components';
import { WorkerData } from '@polkadot/joy-utils/types/workingGroups';
import { LeadInfo } from '@polkadot/joy-utils/react/components/working-groups/LeadInfo';

export type FormValues = GenericFormValues & {
  workingGroup: WorkingGroupKey;
};

export const defaultValues: FormValues = {
  ...genericFormDefaultValues,
  workingGroup: 'Storage'
};

// Aditional props coming all the way from export comonent into the inner form.
type FormAdditionalProps = {
  txMethod: string;
  submitParams: any[];
  proposalType: ProposalType;
  showLead?: boolean;
  leadRequired?: boolean;
  leadStakeRequired?: boolean;
  leadRewardRequired?: boolean;
  onLeadChange?: (lead: WorkerData | null) => void;
  disabled?: boolean;
};

// We don't exactly use "container" and "export" components here, but those types are useful for
// generiting the right "FormInnerProps"
type ExportComponentProps = ProposalFormExportProps<FormAdditionalProps, FormValues>;
type FormContainerProps = ProposalFormContainerProps<ExportComponentProps>;
export type FormInnerProps = ProposalFormInnerProps<FormContainerProps, FormValues>;

export const GenericWorkingGroupProposalForm: React.FunctionComponent<FormInnerProps> = props => {
  const {
    handleChange,
    errors,
    touched,
    values,
    showLead = true,
    leadRequired = false,
    leadStakeRequired = false,
    leadRewardRequired = false,
    onLeadChange,
    disabled = false
  } = props;
  const transport = useTransport();
  const [lead, error, loading] = usePromise(
    () => transport.workingGroups.currentLead(values.workingGroup),
    null,
    [values.workingGroup],
    onLeadChange
  );
  const leadRes = { lead, error, loading };
  const leadMissing = leadRequired && (!leadRes.loading && !leadRes.error) && !leadRes.lead;
  const stakeMissing = leadStakeRequired && (!leadRes.loading && !leadRes.error) && (leadRes.lead && !leadRes.lead.stake);
  const rewardMissing = leadRewardRequired && (!leadRes.loading && !leadRes.error) && (leadRes.lead && !leadRes.lead.reward);
  const isDisabled = disabled || leadMissing || stakeMissing || rewardMissing || leadRes.error;

  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  return (
    <GenericProposalForm {...props} disabled={isDisabled}>
      <FormField
        error={errorLabelsProps.workingGroup}
        label="Working group"
      >
        <Dropdown
          name="workingGroup"
          placeholder="Select the working group"
          selection
          options={Object.keys(WorkingGroupDef).map(wgKey => ({ text: wgKey + ' Working Group', value: wgKey }))}
          value={values.workingGroup}
          onChange={ handleChange }
        />
      </FormField>
      { showLead && (
        <PromiseComponent message={'Fetching current lead...'} {...leadRes}>
          <LeadInfo lead={leadRes.lead} group={values.workingGroup} header={true}/>
        </PromiseComponent>
      ) }
      { leadMissing && (
        <Message error visible>
          <Message.Header>Leader required</Message.Header>
          Selected working group has no active leader. An active leader is required in order to create this proposal.
        </Message>
      ) }
      { stakeMissing && (
        <Message error visible>
          <Message.Header>No role stake</Message.Header>
          Selected working group leader has no associated role stake, which is required in order to create this proposal.
        </Message>
      ) }
      { rewardMissing && (
        <Message error visible>
          <Message.Header>No reward relationship</Message.Header>
          Selected working group leader has no reward relationship, which is required in order to create this proposal.
        </Message>
      ) }
      { props.children }
    </GenericProposalForm>
  );
};
