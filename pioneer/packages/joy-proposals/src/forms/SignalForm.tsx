import React from 'react';
import { getFormErrorLabelsProps } from './errorHandling';
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
import { TextareaFormField } from './FormFields';
import { withFormContainer } from './FormContainer';
import './forms.css';

export type FormValues = GenericFormValues & {
  description: string;
};

const defaultValues: FormValues = {
  ...genericFormDefaultValues,
  description: ''
};

type FormAdditionalProps = {}; // Aditional props coming all the way from export comonent into the inner form.
type ExportComponentProps = ProposalFormExportProps<FormAdditionalProps, FormValues>;
type FormContainerProps = ProposalFormContainerProps<ExportComponentProps>;
type FormInnerProps = ProposalFormInnerProps<FormContainerProps, FormValues>;

const SignalForm: React.FunctionComponent<FormInnerProps> = props => {
  const { handleChange, errors, touched, values } = props;
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);

  return (
    <GenericProposalForm
      {...props}
      txMethod="createTextProposal"
      proposalType="Text"
      submitParams={[props.myMemberId, values.title, values.rationale, '{STAKE}', values.description]}
    >
      <TextareaFormField
        label="Description"
        help="The extensive description of your proposal"
        onChange={handleChange}
        name="description"
        placeholder="What I would like to propose is..."
        error={errorLabelsProps.description}
        value={values.description}
      />
    </GenericProposalForm>
  );
};

const FormContainer = withFormContainer<FormContainerProps, FormValues>({
  mapPropsToValues: (props: FormContainerProps) => ({
    ...defaultValues,
    ...(props.initialData || {})
  }),
  validationSchema: Yup.object().shape({
    ...genericFormDefaultOptions.validationSchema,
    ...Validation.Text()
  }),
  handleSubmit: genericFormDefaultOptions.handleSubmit,
  displayName: 'SignalForm'
})(SignalForm);

export default withProposalFormData<FormContainerProps, ExportComponentProps>(FormContainer);
