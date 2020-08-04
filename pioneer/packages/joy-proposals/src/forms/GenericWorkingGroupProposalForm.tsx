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
import { WorkingGroupKeys, WorkingGroupDef } from '@joystream/types/common';
import './forms.css';
import { Dropdown, Message } from 'semantic-ui-react';
import { usePromise, useTransport } from '@polkadot/joy-utils/react/hooks';
import { PromiseComponent } from '@polkadot/joy-utils/react/components';
import { ProfilePreviewFromStruct as MemberPreview } from '@polkadot/joy-utils/MemberProfilePreview';

export type FormValues = GenericFormValues & {
  workingGroup: WorkingGroupKeys;
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
};

// We don't exactly use "container" and "export" components here, but those types are useful for
// generiting the right "FormInnerProps"
type ExportComponentProps = ProposalFormExportProps<FormAdditionalProps, FormValues>;
type FormContainerProps = ProposalFormContainerProps<ExportComponentProps>;
export type FormInnerProps = ProposalFormInnerProps<FormContainerProps, FormValues>;

export const GenericWorkingGroupProposalForm: React.FunctionComponent<FormInnerProps> = props => {
  const { handleChange, errors, touched, values, showLead = true } = props;
  const transport = useTransport();
  const [lead, error, loading] = usePromise(
    () => transport.workingGroups.currentLead(values.workingGroup),
    null,
    [values.workingGroup]
  );
  const leadRes = { lead, error, loading };

  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  return (
    <GenericProposalForm {...props}>
      <FormField
        error={errorLabelsProps.workingGroup}
        label="Working group"
      >
        <Dropdown
          name="workingGroup"
          placeholder="Select the working group"
          selection
          options={Object.keys(WorkingGroupDef).map(wgKey => ({ text: wgKey + ' Wroking Group', value: wgKey }))}
          value={values.workingGroup}
          onChange={ handleChange }
        />
      </FormField>
      { showLead && (
        <PromiseComponent message={'Fetching current lead...'} {...leadRes}>
          <Message info>
            <Message.Content>
              <Message.Header>Current {values.workingGroup} Working Group lead:</Message.Header>
              <div style={{ padding: '0.5rem 0' }}>
                { leadRes.lead ? <MemberPreview profile={leadRes.lead.profile} /> : 'NONE' }
              </div>
            </Message.Content>
          </Message>
        </PromiseComponent>
      ) }
      { props.children }
    </GenericProposalForm>
  );
};
