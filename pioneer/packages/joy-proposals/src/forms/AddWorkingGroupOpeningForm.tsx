import React, { useEffect } from 'react';
import { getFormErrorLabelsProps, FormErrorLabelsProps } from './errorHandling';
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
import { FormField, InputFormField, TextareaFormField } from './FormFields';
import { withFormContainer } from './FormContainer';
import './forms.css';
import { ActivateOpeningAtKey, ActivateOpeningAtDef, StakingAmountLimitModeKeys, IApplicationRationingPolicy, IStakingPolicy } from '@joystream/types/hiring';
import { GenericJoyStreamRoleSchema } from '@joystream/types/hiring/schemas/role.schema.typings';
import { Dropdown, Grid, Message, Checkbox } from 'semantic-ui-react';
import { formatBalance } from '@polkadot/util';
import _ from 'lodash';
import { IWorkingGroupOpeningPolicyCommitment } from '@joystream/types/working-group';
import { IAddOpeningParameters } from '@joystream/types/proposals';
import { WorkingGroupKey, InputValidationLengthConstraint } from '@joystream/types/common';
import { BlockNumber } from '@polkadot/types/interfaces';
import { withCalls } from '@polkadot/react-api';
import { SimplifiedTypeInterface } from '@polkadot/joy-utils/types/common';
import Validation from '../validationSchema';

export type FormValues = WGFormValues & {
  activateAt: ActivateOpeningAtKey;
  activateAtBlock: string;
  maxReviewPeriodLength: string;
  applicationsLimited: boolean;
  maxApplications: string;
  applicationStakeRequired: boolean;
  applicationStakeMode: StakingAmountLimitModeKeys;
  applicationStakeValue: string;
  roleStakeRequired: boolean;
  roleStakeMode: StakingAmountLimitModeKeys;
  roleStakeValue: string;
  terminateRoleUnstakingPeriod: string;
  leaveRoleUnstakingPeriod: string;
  humanReadableText: string;
};

const defaultValues: FormValues = {
  ...wgFromDefaultValues,
  activateAt: 'CurrentBlock',
  activateAtBlock: '',
  maxReviewPeriodLength: (14400 * 30).toString(), // 30 days
  applicationsLimited: false,
  maxApplications: '',
  applicationStakeRequired: false,
  applicationStakeMode: StakingAmountLimitModeKeys.Exact,
  applicationStakeValue: '',
  roleStakeRequired: false,
  roleStakeMode: StakingAmountLimitModeKeys.Exact,
  roleStakeValue: '',
  terminateRoleUnstakingPeriod: (14400 * 7).toString(), // 7 days
  leaveRoleUnstakingPeriod: (14400 * 7).toString(), // 7 days
  humanReadableText: ''
};

const HRTDefault: (memberHandle: string, group: WorkingGroupKey) => GenericJoyStreamRoleSchema =
  (memberHandle, group) => ({
    version: 1,
    headline: `Looking for ${group} Working Group Leader!`,
    job: {
      title: `${group} Working Group Leader`,
      description: `Become ${group} Working Group Leader! This is a great opportunity to support Joystream!`
    },
    application: {
      sections: [
        {
          title: 'About you',
          questions: [
            {
              title: 'Your name',
              type: 'text'
            },
            {
              title: 'What makes you a good fit for the job?',
              type: 'text area'
            }
          ]
        }
      ]
    },
    reward: '100 JOY per block',
    creator: {
      membership: {
        handle: memberHandle
      }
    }
  });

type FormAdditionalProps = {}; // Aditional props coming all the way from export component into the inner form.
type ExportComponentProps = ProposalFormExportProps<FormAdditionalProps, FormValues>;
type FormContainerProps = ProposalFormContainerProps<ExportComponentProps> & {
  currentBlock?: BlockNumber;
  HRTConstraint?: InputValidationLengthConstraint;
};
type FormInnerProps = ProposalFormInnerProps<FormContainerProps, FormValues>;

type StakeFieldsProps = Pick<FormInnerProps, 'values' | 'handleChange' | 'setFieldValue'> & {
  errorLabelsProps: FormErrorLabelsProps<FormValues>;
  stakeType: 'role' | 'application';
};
const StakeFields: React.FunctionComponent<StakeFieldsProps> = ({
  values,
  errorLabelsProps,
  handleChange,
  stakeType,
  setFieldValue
}) => {
  return (
  <>
    <FormField label={`${_.startCase(stakeType)} stake` }>
      <Checkbox
        toggle
        onChange={(e, data) => { setFieldValue(`${stakeType}StakeRequired`, data.checked); }}
        label={ `Require ${stakeType} stake` }
        checked={ stakeType === 'role' ? values.roleStakeRequired : values.applicationStakeRequired }/>
    </FormField>
    { (stakeType === 'role' ? values.roleStakeRequired : values.applicationStakeRequired) && (<>
      <FormField label="Stake mode">
        <Dropdown
          onChange={handleChange}
          name={ `${stakeType}StakeMode` }
          selection
          options={[StakingAmountLimitModeKeys.Exact, StakingAmountLimitModeKeys.AtLeast].map(mode => ({ text: mode, value: mode }))}
          value={ stakeType === 'role' ? values.roleStakeMode : values.applicationStakeMode }
        />
      </FormField>
      <InputFormField
        label="Stake value"
        unit={formatBalance.getDefaults().unit}
        onChange={handleChange}
        name={ `${stakeType}StakeValue` }
        error={ stakeType === 'role' ? errorLabelsProps.roleStakeValue : errorLabelsProps.applicationStakeValue}
        value={ stakeType === 'role' ? values.roleStakeValue : values.applicationStakeValue}
        placeholder={'ie. 100'}
      />
    </>) }
  </>
  );
};

const valuesToAddOpeningParams = (values: FormValues): SimplifiedTypeInterface<IAddOpeningParameters> => {
  const commitment: SimplifiedTypeInterface<IWorkingGroupOpeningPolicyCommitment> = {
    max_review_period_length: parseInt(values.maxReviewPeriodLength)
  };
  if (parseInt(values.terminateRoleUnstakingPeriod) > 0) {
    commitment.terminate_role_stake_unstaking_period = parseInt(values.terminateRoleUnstakingPeriod);
  }
  if (parseInt(values.leaveRoleUnstakingPeriod) > 0) {
    commitment.exit_role_stake_unstaking_period = parseInt(values.leaveRoleUnstakingPeriod);
  }
  if (values.applicationsLimited) {
    const rationingPolicy: SimplifiedTypeInterface<IApplicationRationingPolicy> = {
      max_active_applicants: parseInt(values.maxApplications)
    };
    commitment.application_rationing_policy = rationingPolicy;
  }
  if (values.applicationStakeRequired) {
    const applicationStakingPolicy: SimplifiedTypeInterface<IStakingPolicy> = {
      amount: parseInt(values.applicationStakeValue),
      amount_mode: values.applicationStakeMode
    };
    commitment.application_staking_policy = applicationStakingPolicy;
  }
  if (values.roleStakeRequired) {
    const roleStakingPolicy: SimplifiedTypeInterface<IStakingPolicy> = {
      amount: parseInt(values.roleStakeValue),
      amount_mode: values.roleStakeMode
    };
    commitment.role_staking_policy = roleStakingPolicy;
  }
  return {
    activate_at: { [values.activateAt]: values.activateAt === 'ExactBlock' ? parseInt(values.activateAtBlock) : null },
    commitment: commitment,
    human_readable_text: values.humanReadableText,
    working_group: values.workingGroup
  };
};

const AddWorkingGroupOpeningForm: React.FunctionComponent<FormInnerProps> = props => {
  const { handleChange, errors, touched, values, setFieldValue, myMemberId, myMembership } = props;
  useEffect(() => {
    if (myMembership && !touched.humanReadableText) {
      setFieldValue(
        'humanReadableText',
        JSON.stringify(HRTDefault(myMembership.handle.toString(), values.workingGroup), undefined, 4)
      );
    }
  }, [values.workingGroup, myMembership]);
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);

  return (
    <GenericWorkingGroupProposalForm
      {...props}
      txMethod="createAddWorkingGroupLeaderOpeningProposal"
      proposalType="AddWorkingGroupLeaderOpening"
      submitParams={[
        myMemberId,
        values.title,
        values.rationale,
        '{STAKE}',
        valuesToAddOpeningParams(values)
      ]}
    >
      <Grid columns="4" doubling stackable verticalAlign="bottom">
        <Grid.Row>
          <Grid.Column>
            <FormField label="Activate opening at">
              <Dropdown
                onChange={handleChange}
                name="activateAt"
                selection
                options={Object.keys(ActivateOpeningAtDef).map(wgKey => ({ text: wgKey, value: wgKey }))}
                value={values.activateAt}
              />
            </FormField>
          </Grid.Column>
          <Grid.Column>
            { values.activateAt === 'ExactBlock' && (
              <InputFormField
                onChange={handleChange}
                name="activateAtBlock"
                error={errorLabelsProps.activateAtBlock}
                value={values.activateAtBlock}
                placeholder={'Provide the block number'}
              />
            ) }
          </Grid.Column>
        </Grid.Row>
      </Grid>
      { values.activateAt === 'ExactBlock' && (
        <Message info>
          In case <b>ExactBlock</b> is specified, the opening will remain in <i>Waiting to Begin</i> stage (which means it will be visible,
          but no applicants will be able to apply yet) until current block number will equal the specified number.
        </Message>
      ) }
      <Grid columns="4" doubling stackable verticalAlign="bottom">
        <Grid.Row>
          <Grid.Column>
            <InputFormField
              label="Max. review period"
              onChange={handleChange}
              name="maxReviewPeriodLength"
              error={errorLabelsProps.maxReviewPeriodLength}
              value={values.maxReviewPeriodLength}
              placeholder={'ie. 72000'}
              unit="blocks"
            />
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <Grid columns="4" doubling stackable verticalAlign="bottom">
        <Grid.Row>
          <Grid.Column>
            <FormField label="Applications limit">
              <Checkbox
                toggle
                onChange={(e, data) => { setFieldValue('applicationsLimited', data.checked); }}
                label="Limit applications"
                checked={values.applicationsLimited}/>
            </FormField>
            { values.applicationsLimited && (
              <InputFormField
                onChange={handleChange}
                name="maxApplications"
                error={errorLabelsProps.maxApplications}
                value={values.maxApplications}
                placeholder={'Max. number of applications'}
              />
            ) }
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <Grid columns="2" stackable style={{ marginBottom: 0 }}>
        <Grid.Row>
          <Grid.Column>
            <StakeFields stakeType="application" {...{ errorLabelsProps, values, handleChange, setFieldValue }}/>
          </Grid.Column>
          <Grid.Column>
            <StakeFields stakeType="role" {...{ errorLabelsProps, values, handleChange, setFieldValue }}/>
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <Grid columns="2" stackable style={{ marginBottom: 0 }}>
        <Grid.Row>
          <Grid.Column>
            <InputFormField
              onChange={handleChange}
              name="terminateRoleUnstakingPeriod"
              error={errorLabelsProps.terminateRoleUnstakingPeriod}
              value={values.terminateRoleUnstakingPeriod}
              label={'Terminate role unstaking period'}
              placeholder={'ie. 14400'}
              unit="blocks"
              help={
                'In case leader role or application is terminated - this will be the unstaking period for the role stake (in blocks).'
              }
            />
          </Grid.Column>
          <Grid.Column>
            <InputFormField
              onChange={handleChange}
              name="leaveRoleUnstakingPeriod"
              error={errorLabelsProps.leaveRoleUnstakingPeriod}
              value={values.leaveRoleUnstakingPeriod}
              label={'Leave role unstaking period'}
              placeholder={'ie. 14400'}
              unit="blocks"
              help={
                'In case leader leaves/exits his role - this will be the unstaking period for his role stake (in blocks). ' +
                'It also applies when user is withdrawing an active leader application.'
              }
            />
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <TextareaFormField
        label="Opening schema (human_readable_text)"
        help="JSON schema that describes some characteristics of the opening presented in the UI (headers, content, application form etc.)"
        onChange={handleChange}
        name="humanReadableText"
        placeholder="Paste the JSON schema here..."
        error={errorLabelsProps.humanReadableText}
        value={values.humanReadableText}
        rows={20}
      />
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
    ...Validation.AddWorkingGroupLeaderOpening(
      props.currentBlock?.toNumber() || 0,
      props.HRTConstraint || InputValidationLengthConstraint.createWithMaxAllowed()
    )
  }),
  handleSubmit: genericFormDefaultOptions.handleSubmit,
  displayName: 'AddWorkingGroupOpeningForm'
})(AddWorkingGroupOpeningForm);

export default withCalls<ExportComponentProps>(
  ['derive.chain.bestNumber', { propName: 'currentBlock' }],
  ['query.storageWorkingGroup.openingHumanReadableText', { propName: 'HRTConstraint' }]
)(
  withProposalFormData<FormContainerProps, ExportComponentProps>(FormContainer)
);
