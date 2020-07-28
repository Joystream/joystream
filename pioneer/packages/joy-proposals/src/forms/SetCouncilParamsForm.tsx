import React, { useEffect, useState } from 'react';
import { getFormErrorLabelsProps } from './errorHandling';
import { Divider, Form } from 'semantic-ui-react';
import * as Yup from 'yup';
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
import { createType } from '@polkadot/types';
import './forms.css';
import { useTransport, usePromise } from '@polkadot/joy-utils/react/hooks';
import _ from 'lodash';
import { ElectionParameters } from '@joystream/types/council';
import { PromiseComponent } from '@polkadot/joy-utils/react/components';

export type FormValues = GenericFormValues & {
  announcingPeriod: string;
  votingPeriod: string;
  minVotingStake: string;
  revealingPeriod: string;
  minCouncilStake: string;
  newTermDuration: string;
  candidacyLimit: string;
  councilSize: string;
};

const defaultValues: FormValues = {
  ...genericFormDefaultValues,
  announcingPeriod: '',
  votingPeriod: '',
  minVotingStake: '',
  revealingPeriod: '',
  minCouncilStake: '',
  newTermDuration: '',
  candidacyLimit: '',
  councilSize: ''
};

type FormAdditionalProps = {}; // Aditional props coming all the way from export comonent into the inner form.
type ExportComponentProps = ProposalFormExportProps<FormAdditionalProps, FormValues>;
type FormContainerProps = ProposalFormContainerProps<ExportComponentProps>;
type FormInnerProps = ProposalFormInnerProps<FormContainerProps, FormValues>;

function createElectionParameters (values: FormValues): ElectionParameters {
  return new ElectionParameters({
    announcing_period: createType('BlockNumber', parseInt(values.announcingPeriod)),
    voting_period: createType('BlockNumber', parseInt(values.votingPeriod)),
    revealing_period: createType('BlockNumber', parseInt(values.revealingPeriod)),
    council_size: createType('u32', values.councilSize),
    candidacy_limit: createType('u32', values.candidacyLimit),
    new_term_duration: createType('BlockNumber', parseInt(values.newTermDuration)),
    min_council_stake: createType('Balance', values.minCouncilStake),
    min_voting_stake: createType('Balance', values.minVotingStake)
  });
}

const SetCouncilParamsForm: React.FunctionComponent<FormInnerProps> = props => {
  const { handleChange, errors, touched, values, setFieldValue, setFieldError } = props;
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  const [placeholders, setPlaceholders] = useState<{ [k in keyof FormValues]: string }>(defaultValues);

  const transport = useTransport();
  const [councilParams, error, loading] = usePromise<ElectionParameters | null>(() => transport.council.electionParameters(), null);
  useEffect(() => {
    if (councilParams) {
      const fetchedPlaceholders = { ...placeholders };
      const fieldsToPopulate = [
        'announcing_period',
        'voting_period',
        'min_voting_stake',
        'revealing_period',
        'min_council_stake',
        'new_term_duration',
        'candidacy_limit',
        'council_size'
      ] as const;
      fieldsToPopulate.forEach(field => {
        const camelCaseField = _.camelCase(field) as keyof FormValues;
        setFieldValue(camelCaseField, councilParams[field].toString());
        fetchedPlaceholders[camelCaseField] = councilParams[field].toString();
      });
      setPlaceholders(fetchedPlaceholders);
    }
  }, [councilParams]);

  // This logic may be moved somewhere else in the future, but it's quite easy to enforce it here:
  if (!errors.candidacyLimit && !errors.councilSize && parseInt(values.candidacyLimit) < parseInt(values.councilSize)) {
    setFieldError('candidacyLimit', `Candidacy limit must be >= council size (${values.councilSize})`);
  }

  return (
    <PromiseComponent error={error} loading={loading} message="Fetching current parameters...">
      <GenericProposalForm
        {...props}
        txMethod="createSetElectionParametersProposal"
        proposalType="SetElectionParameters"
        submitParams={[props.myMemberId, values.title, values.rationale, '{STAKE}', createElectionParameters(values)]}
      >
        <Divider horizontal>Voting </Divider>
        <Form.Group widths="equal" style={{ marginBottom: '8rem' }}>
          <InputFormField
            label="Announcing Period"
            help="Announcing period in blocks"
            onChange={handleChange}
            name="announcingPeriod"
            error={errorLabelsProps.announcingPeriod}
            value={values.announcingPeriod}
            placeholder={ placeholders.announcingPeriod }
          />
          <InputFormField
            label="Voting Period"
            help="Voting period in blocks"
            onChange={handleChange}
            name="votingPeriod"
            error={errorLabelsProps.votingPeriod}
            value={values.votingPeriod}
            placeholder={ placeholders.votingPeriod }
          />
          <InputFormField
            label="Revealing Period"
            help="Revealing period in blocks"
            fluid
            onChange={handleChange}
            name="revealingPeriod"
            error={errorLabelsProps.revealingPeriod}
            value={values.revealingPeriod}
            placeholder={ placeholders.revealingPeriod }
          />
          <InputFormField
            label="Minimum Voting Stake"
            help="The minimum voting stake"
            fluid
            onChange={handleChange}
            name="minVotingStake"
            error={errorLabelsProps.minVotingStake}
            value={values.minVotingStake}
            placeholder={ placeholders.minVotingStake }
            disabled
          />
        </Form.Group>
        <Divider horizontal>Council</Divider>
        <Form.Group widths="equal" style={{ marginBottom: '8rem' }}>
          <InputFormField
            label="Minimum Council Stake"
            help="The minimum council stake"
            fluid
            onChange={handleChange}
            name="minCouncilStake"
            error={errorLabelsProps.minCouncilStake}
            value={values.minCouncilStake}
            placeholder={ placeholders.minCouncilStake }
            disabled
          />
          <InputFormField
            label="New Term Duration"
            help="Duration of the new term in blocks"
            fluid
            onChange={handleChange}
            name="newTermDuration"
            error={errorLabelsProps.newTermDuration}
            value={values.newTermDuration}
            placeholder={ placeholders.newTermDuration }
          />
          <InputFormField
            label="Council Size"
            help="The size of the council (number of seats)"
            fluid
            onChange={handleChange}
            name="councilSize"
            error={errorLabelsProps.councilSize}
            value={values.councilSize}
            placeholder={ placeholders.councilSize }
          />
          <InputFormField
            label="Candidacy Limit"
            help="How many candidates that will be allowed in to the voting stage"
            fluid
            onChange={handleChange}
            name="candidacyLimit"
            error={errorLabelsProps.candidacyLimit}
            value={values.candidacyLimit}
            placeholder={ placeholders.candidacyLimit }
          />
        </Form.Group>
      </GenericProposalForm>
    </PromiseComponent>
  );
};

const FormContainer = withFormContainer<FormContainerProps, FormValues>({
  mapPropsToValues: (props: FormContainerProps) => ({
    ...defaultValues,
    ...(props.initialData || {})
  }),
  validationSchema: Yup.object().shape({
    ...genericFormDefaultOptions.validationSchema,
    ...Validation.SetElectionParameters()
  }),
  handleSubmit: genericFormDefaultOptions.handleSubmit,
  displayName: 'SetCouncilParamsForm'
})(SetCouncilParamsForm);

export default withProposalFormData<FormContainerProps, ExportComponentProps>(FormContainer);
