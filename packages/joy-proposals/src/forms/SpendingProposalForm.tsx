import React from "react";
import { FormikProps } from "formik";
import { getFormErrorLabelsProps } from "./errorHandling";
import * as Yup from "yup";
import { Dropdown, Label } from "semantic-ui-react";
import {
  GenericProposalForm,
  GenericFormValues,
  genericFormDefaultOptions,
  DefaultOuterFormProps,
  genericFormDefaultValues
} from "./GenericProposalForm";
import { InputFormField, FormField } from "./FormFields";
import { withFormContainer } from "./FormContainer";
import "./forms.css";

type FormValues = GenericFormValues & {
  destinationAccount: any;
  tokens: string;
};

const defaultValues: FormValues = {
  ...genericFormDefaultValues,
  destinationAccount: "",
  tokens: ""
};

type FormAdditionalProps = {
  destinationAccounts: any[];
};
type SpendingProposalProps = FormikProps<FormValues> & FormAdditionalProps;

const SpendingProposalForm: React.FunctionComponent<SpendingProposalProps> = props => {
  const { handleChange, destinationAccounts, errors, touched, values } = props;
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  return (
    <GenericProposalForm {...props}>
      <InputFormField
        label="Amount of tokens"
        help="The amount of tokens you propose to spend"
        onChange={handleChange}
        className="tokens"
        name="tokens"
        placeholder="100"
        error={errorLabelsProps.tokens}
        unit={"tJOY"}
        value={values.tokens}
      />
      <FormField
        error={errorLabelsProps.destinationAccount}
        label="Destination account"
        help="The account you propose to send the tokens into"
      >
        <Dropdown
          clearable
          name="destinationAccount"
          labeled
          placeholder="Select Destination Account"
          fluid
          selection
          options={destinationAccounts}
          onChange={handleChange}
          value={values.destinationAccount}
        />
        {errorLabelsProps.destinationAccount && <Label {...errorLabelsProps.destinationAccount} prompt />}
      </FormField>
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
    tokens: Yup.number().required("You need to specify an amount of tokens."),
    destinationAccount: Yup.string().required("Select a destination account!")
  }),
  handleSubmit: genericFormDefaultOptions.handleSubmit,
  displayName: "SpendingProposalsForm"
})(SpendingProposalForm);
