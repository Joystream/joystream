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
import { Dropdown } from 'semantic-ui-react';
import _ from 'lodash';
import Validation from '../validationSchema';
import { useTransport, usePromise } from '@polkadot/joy-utils/react/hooks';
import { OpeningData } from '@polkadot/joy-utils/types/workingGroups';
import { PromiseComponent } from '@polkadot/joy-utils/react/components';

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
  const { handleChange, values, myMemberId } = props;
  const transport = useTransport();
  const [allOpenings, openingsError, openingsLoading] = usePromise(
    () => transport.workingGroups.allOpenings(values.workingGroup),
    [] as OpeningData[],
    [values.workingGroup]
  );
  const openingsOptions = allOpenings
    // Filter by "Accepting applications" only
    .filter(od =>
      od.hiringOpening.stage.isOfType('Active') &&
      od.hiringOpening.stage.asType('Active').stage.isOfType('AcceptingApplications')
    )
    // Map to options
    .map(od => {
      const hrt = od.hiringOpening.parse_human_readable_text(); // TODO: With fallback!
      return {
        text: od.id.toString() + ': ' + (typeof hrt === 'object' ? hrt.headline + ` (${hrt.job.title})` : 'Unkown'),
        value: od.id.toString()
      };
    });

  return (
    <GenericWorkingGroupProposalForm
      {...props}
      txMethod="createBeginReviewWorkingGroupLeaderApplicationsProposal"
      proposalType="BeginReviewWorkingGroupLeaderApplication"
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
        <FormField
          label="Working Group Opening">
          <Dropdown
            onChange={handleChange}
            name={'openingId'}
            selection
            options={openingsOptions}
            value={values.openingId}
          />
        </FormField>
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
