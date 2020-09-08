import React from 'react';
import { Form } from 'semantic-ui-react';
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
import { withFormContainer } from './FormContainer';
import './forms.css';
import FileDropdown from './FileDropdown';

export type FormValues = GenericFormValues & {
  // wasm blob as ArrayBuffer, or an Error string
  WASM: ArrayBuffer | string;
};

const defaultValues: FormValues = {
  ...genericFormDefaultValues,
  WASM: new ArrayBuffer(0)
};

type FormAdditionalProps = {}; // Aditional props coming all the way from export comonent into the inner form.
type ExportComponentProps = ProposalFormExportProps<FormAdditionalProps, FormValues>;
type FormContainerProps = ProposalFormContainerProps<ExportComponentProps>;
type FormInnerProps = ProposalFormInnerProps<FormContainerProps, FormValues>;

const RuntimeUpgradeForm: React.FunctionComponent<FormInnerProps> = props => {
  const { errors, setFieldValue, setFieldTouched, values, touched } = props;
  return (
    <GenericProposalForm
      {...props}
      txMethod="createRuntimeUpgradeProposal"
      proposalType="RuntimeUpgrade"
      submitParams={[props.myMemberId, values.title, values.rationale, '{STAKE}', values.WASM]}
    >
      <Form.Field>
        <FileDropdown<FormValues>
          setFieldValue={setFieldValue}
          setFieldTouched={setFieldTouched}
          defaultText="Drag-n-drop WASM bytecode of a runtime upgrade (*.wasm)"
          acceptedFormats=".wasm"
          name="WASM"
          error={touched.WASM ? errors.WASM : undefined}
          interpretAs='binary'
        />
      </Form.Field>
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
    ...Validation.RuntimeUpgrade()
  }),
  handleSubmit: genericFormDefaultOptions.handleSubmit,
  displayName: 'RuntimeUpgradeForm'
})(RuntimeUpgradeForm);

export default withProposalFormData(FormContainer);
