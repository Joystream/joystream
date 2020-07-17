import React from 'react';
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
import FormField from './FormFields';
import { withFormContainer } from './FormContainer';
import './forms.css';
import { Dropdown, Message } from 'semantic-ui-react';
import _ from 'lodash';
import Validation from '../validationSchema';
import { useTransport, usePromise } from '@polkadot/joy-utils/react/hooks';
import { OpeningData } from '@polkadot/joy-utils/types/workingGroups';
import { PromiseComponent } from '@polkadot/joy-utils/react/components';
import { getFormErrorLabelsProps } from './errorHandling';

export type FormValues = WGFormValues & {
  openingId: string;
};

const defaultValues: FormValues = {
  ...wgFromDefaultValues,
  openingId: ''
};

type FormAdditionalProps = {}; // Aditional props coming all the way from export component into the inner form.
type ExportComponentProps = ProposalFormExportProps<FormAdditionalProps, FormValues>;
type FormContainerProps = ProposalFormContainerProps<ExportComponentProps>;
type FormInnerProps = ProposalFormInnerProps<FormContainerProps, FormValues>;

const BeginReviewLeadeApplicationsForm: React.FunctionComponent<FormInnerProps> = props => {
  const { handleChange, values, myMemberId, errors, touched } = props;
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  const transport = useTransport();
  const [openings, openingsError, openingsLoading] = usePromise(
    () => transport.workingGroups.activeOpenings(values.workingGroup, 'AcceptingApplications', 'Leader'),
    [] as OpeningData[],
    [values.workingGroup]
  );
  const openingsOptions = openings
    // Map to options
    .map(od => {
      const hrt = od.hiringOpening.parse_human_readable_text_with_fallback();
      return {
        text: `${od.id.toString()}: ${hrt.headline} (${hrt.job.title})`,
        value: od.id.toString()
      };
    });

  return (
    <GenericWorkingGroupProposalForm
      {...props}
      txMethod="createBeginReviewWorkingGroupLeaderApplicationsProposal"
      proposalType="BeginReviewWorkingGroupLeaderApplication"
      disabled={!openingsOptions.length}
      submitParams={[
        myMemberId,
        values.title,
        values.rationale,
        '{STAKE}',
        values.openingId,
        values.workingGroup
      ]}
    >
      <PromiseComponent error={openingsError} loading={openingsLoading} message="Fetching openings...">
        { !openingsOptions.length
          ? (
            <Message error visible>
              <Message.Header>No openings available!</Message.Header>
              <Message.Content>
                This proposal cannot be created, because no leader openings in <i>Accepting Applications</i> stage are currently available
                in {values.workingGroup} Working Group.
              </Message.Content>
            </Message>
          )
          : (
            <FormField
              label="Working Group Opening"
              error={errorLabelsProps.openingId}
              showErrorMsg>
              <Dropdown
                onChange={handleChange}
                name={'openingId'}
                selection
                options={openingsOptions}
                value={values.openingId}
              />
            </FormField>
          )
        }
      </PromiseComponent>
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
    ...Validation.BeginReviewWorkingGroupLeaderApplication()
  }),
  handleSubmit: genericFormDefaultOptions.handleSubmit,
  displayName: 'BeginReviewLeadeApplicationsForm'
})(BeginReviewLeadeApplicationsForm);

export default withProposalFormData<FormContainerProps, ExportComponentProps>(FormContainer);
