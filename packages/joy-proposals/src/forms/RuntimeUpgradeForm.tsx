import React from "react";
import { FormikProps } from "formik";
import { Form } from "semantic-ui-react";
import * as Yup from "yup";
import {
  GenericProposalForm,
  GenericFormValues,
  genericFormDefaultOptions,
  DefaultOuterFormProps,
  genericFormDefaultValues
} from './GenericProposalForm';
import { withFormContainer } from "./FormContainer";
import "./forms.css";
import FileDropdown from './FileDropdown';

type FormValues = GenericFormValues & {
  WASM: string
};

const defaultValues:FormValues = {
  ...genericFormDefaultValues,
  WASM: ''
}

type FormAdditionalProps = {};
type RuntimeUpgradeFormProps = FormikProps<FormValues> & FormAdditionalProps;

const RuntimeUpgradeForm: React.FunctionComponent<RuntimeUpgradeFormProps> = props => {
  const { handleChange, handleSubmit, isSubmitting, errors, touched, setFieldValue } = props;
  const passProps = { handleChange, errors, isSubmitting, touched, handleSubmit };
  return (
    <GenericProposalForm {...passProps}>
      <Form.Field>
        <FileDropdown<FormValues>
          setFieldValue={setFieldValue}
          defaultText="Drag-n-drop WASM bytecode of a runtime upgrade (*.wasm)"
          acceptedFormats=".wasm"
          name="WASM"
          error={ errors.WASM }/>
      </Form.Field>
    </GenericProposalForm>
  );
}

type OuterFormProps = DefaultOuterFormProps<FormAdditionalProps, FormValues>;

export default withFormContainer<OuterFormProps, FormValues>({
  mapPropsToValues: (props:OuterFormProps) => ({
    ...defaultValues,
    ...(props.initialData || {})
  }),
  validationSchema: Yup.object().shape({
    ...genericFormDefaultOptions.validationSchema,
    WASM: Yup.string().required('The file is empty!'),
  }),
  handleSubmit: genericFormDefaultOptions.handleSubmit,
  displayName: "RuntimeUpgradeForm"
})(RuntimeUpgradeForm);
