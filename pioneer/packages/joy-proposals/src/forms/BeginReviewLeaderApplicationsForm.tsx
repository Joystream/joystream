import React from 'react';
import * as Yup from 'yup';
import { withProposalFormData,
  ProposalFormExportProps,
  ProposalFormContainerProps,
  ProposalFormInnerProps } from './GenericProposalForm';
import { GenericWorkingGroupProposalForm,
  FormValues as WGFormValues,
  defaultValues as wgFromDefaultValues } from './GenericWorkingGroupProposalForm';
import FormField from './FormFields';
import { withFormContainer } from './FormContainer';
import { Dropdown, Message } from 'semantic-ui-react';
import _ from 'lodash';
import Validation from '../validationSchema';
import { useTransport, usePromise } from '@polkadot/joy-utils/react/hooks';
import { OpeningPair } from '@joystream/js/types/workingGroups';
import PromiseComponent from '@polkadot/joy-utils/react/components/PromiseComponent';
import { getFormErrorLabelsProps } from './errorHandling';

export type FormValues = WGFormValues & {
  openingId: string;
};

const defaultValues: FormValues = {
  ...wgFromDefaultValues,
  openingId: ''
};

type FormAdditionalProps = Record<any, never>; // Aditional props coming all the way from export component into the inner form.
type ExportComponentProps = ProposalFormExportProps<FormAdditionalProps, FormValues>;
type FormContainerProps = ProposalFormContainerProps<ExportComponentProps>;
type FormInnerProps = ProposalFormInnerProps<FormContainerProps, FormValues>;

const BeginReviewLeadeApplicationsForm: React.FunctionComponent<FormInnerProps> = (props) => {
  const { handleChange, values, errors, touched } = props;
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  const transport = useTransport();
  const [openings, openingsError, openingsLoading] = usePromise(
    () => transport.workingGroups.activeOpeningPairs(values.workingGroup, 'AcceptingApplications', 'Leader'),
    [] as OpeningPair[],
    [values.workingGroup]
  );
  const openingsOptions = openings
    // Map to options
    .map((op) => {
      const hrt = op.hiringOpening.parse_human_readable_text_with_fallback();

      return {
        text: `${op.id.toString()}: ${hrt.headline} (${hrt.job.title})`,
        value: op.id.toString()
      };
    });

  return (
    <GenericWorkingGroupProposalForm
      {...props}
      txMethod='createBeginReviewWorkingGroupLeaderApplicationsProposal'
      proposalType='BeginReviewWorkingGroupLeaderApplication'
      disabled={!openingsOptions.length}
      submitParams={[
        values.openingId,
        values.workingGroup
      ]}
    >
      <PromiseComponent error={openingsError} loading={openingsLoading} message='Fetching openings...'>
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
              label='Working Group Opening'
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
    ...Validation.All(),
    ...Validation.BeginReviewWorkingGroupLeaderApplication()
  }),
  handleSubmit: () => null,
  displayName: 'BeginReviewLeadeApplicationsForm'
})(BeginReviewLeadeApplicationsForm);

export default withProposalFormData<FormContainerProps, ExportComponentProps>(FormContainer);
