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
} from "./GenericProposalForm";
import { TextareaFormField } from "./FormFields";
import { withFormContainer } from "./FormContainer";
import "./forms.css";

type FormValues = GenericFormValues & {
  description: string;
};

const defaultValues: FormValues = {
  ...genericFormDefaultValues,
  description: ""
};

type FormAdditionalProps = {};
type SingalFormProps = FormikProps<FormValues> & FormAdditionalProps;

const SignalForm: React.FunctionComponent<SingalFormProps> = props => {
  const { handleChange, errors, touched } = props;
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  return (
    <GenericProposalForm {...props}>
      <TextareaFormField
        label="Description"
        help="The extensive description of your proposal"
        onChange={handleChange}
        name="description"
        placeholder="What I would like to propose is..."
        error={errorLabelsProps.description}
      />
    </GenericProposalForm>
  );
};

type OuterFormProps = DefaultOuterFormProps<FormAdditionalProps, FormValues>;

export default withFormContainer<OuterFormProps, FormValues>({
  mapPropsToValues: (props: OuterFormProps) => ({
    ...defaultValues,
    ...(props.initialData || {})
  }),
  validationSchema: Yup.object().shape({
    ...genericFormDefaultOptions.validationSchema,
    description: Yup.string().required("Description is required!")
  }),
  handleSubmit: genericFormDefaultOptions.handleSubmit,
  displayName: "SignalForm"
})(SignalForm);
