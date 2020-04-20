import React from "react";
import { FormikProps } from "formik";
import { getFormErrorLabelsProps } from "./errorHandling";
import * as Yup from "yup";
import {
  GenericProposalForm,
  GenericFormValues,
  genericFormDefaultOptions,
  DefaultOuterFormProps,
  genericFormDefaultValues
} from './GenericProposalForm';
import FormField from './FormField';
import { withFormContainer } from "./FormContainer";
import "./forms.css";

type FormValues = GenericFormValues & {
  maxValidatorCount: string;
}

const defaultValues: FormValues = {
  ...genericFormDefaultValues,
  maxValidatorCount: ''
}

type SetMaxValidatorCountFormProps = FormikProps<FormValues>;

const SetMaxValidatorCountForm: React.FunctionComponent<SetMaxValidatorCountFormProps> = props => {
  const { handleChange, errors, isSubmitting, touched, handleSubmit } = props;
  const passProps = { handleChange, errors, isSubmitting, touched, handleSubmit };
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  return (
    <GenericProposalForm {...passProps}>
      <FormField
        error={errorLabelsProps.maxValidatorCount}
        label="Max Validator Count"
        help="The new value for maximum number of Validators that you propose"
        onChange={handleChange}
        name="maxValidatorCount"
        placeholder="20"
        />
    </GenericProposalForm>
  );
}

type OuterFormProps = DefaultOuterFormProps<SetMaxValidatorCountFormProps, FormValues>;

export default withFormContainer<OuterFormProps, FormValues>({
  mapPropsToValues: (props:OuterFormProps) => ({
    ...defaultValues,
    ...(props.initialData || {})
  }),
  validationSchema: Yup.object().shape({
    ...genericFormDefaultOptions.validationSchema,
    maxValidatorCount: Yup.number().required('Enter the max validator count'),
  }),
  handleSubmit: genericFormDefaultOptions.handleSubmit,
  displayName: "SetMaxValidatorCountForm"
})(SetMaxValidatorCountForm);
