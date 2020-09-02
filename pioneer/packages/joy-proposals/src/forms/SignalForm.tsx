import React from 'react';
import { getFormErrorLabelsProps } from './errorHandling';
import * as Yup from 'yup';
import { GenericProposalForm,
  GenericFormValues,
  genericFormDefaultValues,
  withProposalFormData,
  ProposalFormExportProps,
  ProposalFormContainerProps,
  ProposalFormInnerProps } from './GenericProposalForm';
import Validation from '../validationSchema';
import { TextareaFormField } from './FormFields';
import { withFormContainer } from './FormContainer';
import { u32 } from '@polkadot/types/primitive';
import { withCalls } from '@polkadot/react-api';

export type FormValues = GenericFormValues & {
  description: string;
};

const defaultValues: FormValues = {
  ...genericFormDefaultValues,
  description: ''
};

type FormAdditionalProps = Record<any, never>; // Aditional props coming all the way from export comonent into the inner form.
type ExportComponentProps = ProposalFormExportProps<FormAdditionalProps, FormValues>;
type FormContainerProps = ProposalFormContainerProps<ExportComponentProps> & {
  textMaxLength: u32;
};
type FormInnerProps = ProposalFormInnerProps<FormContainerProps, FormValues>;

const SignalForm: React.FunctionComponent<FormInnerProps> = (props) => {
  const { handleChange, errors, touched, values } = props;
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);

  return (
    <GenericProposalForm
      {...props}
      txMethod='createTextProposal'
      proposalType='Text'
      submitParams={[values.description]}
    >
      <TextareaFormField
        label='Description'
        help='The extensive description of your proposal'
        onChange={handleChange}
        name='description'
        placeholder='What I would like to propose is...'
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
  validationSchema: (props: FormContainerProps) => Yup.object().shape({
    ...Validation.All(),
    ...Validation.Text(props.textMaxLength.toNumber())
  }),
  handleSubmit: () => null,
  displayName: 'SignalForm'
})(SignalForm);

export default withCalls<ExportComponentProps>(
  ['consts.proposalsCodex.textProposalMaxLength', { propName: 'textMaxLength' }]
)(
  withProposalFormData<FormContainerProps, ExportComponentProps>(FormContainer)
);
