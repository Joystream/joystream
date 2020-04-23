import React from "react";
import { FormikProps } from "formik";
import { getFormErrorLabelsProps } from "./errorHandling";
import * as Yup from "yup";
import LabelWithHelp from "./LabelWithHelp";

import { withFormContainer } from "./FormContainer";
import "./forms.css";

type FormValues = GenericFormValues & {
  destinationAccount: any,
  tokens: string,
};

const defaultValues:FormValues = {
  ...genericFormDefaultValues,
  destinationAccount: '',
  tokens: '',
}

type FormAdditionalProps = {
  destinationAccounts: any[]
};
type SpendingProposalProps = FormikProps<FormValues> & FormAdditionalProps;


const SpendingProposalForm: React.FunctionComponent<SpendingProposalProps> = props => {
  const { handleChange, destinationAccounts, errors, touched, values } = props;
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  return (
    <div className="Forms">
      <Form className="proposal-form" onSubmit={handleSubmit}>
        <Form.Field error={Boolean(errorLabelsProps.title)}>
          <LabelWithHelp text="Title" help="The title of your proposal" />
          <Form.Input
            onChange={handleChange}
            name="title"
            placeholder="Title for your awesome proposal..."
            error={errorLabelsProps.title}
          />
        </Form.Field>
        <Form.Field error={Boolean(errorLabelsProps.rationale)}>
          <LabelWithHelp text="Rationale" help="The rationale behind your proposal" />
          <Form.TextArea
            onChange={handleChange}
            name="rationale"
            placeholder="This proposal is awesome because..."
            error={errorLabelsProps.rationale}
          />
        </Form.Field>
        <Form.Field error={Boolean(errorLabelsProps.tokens)}>
          <LabelWithHelp text="Amount of tokens" help="The amount of tokens you propose to spend" />
          <Form.Input
            style={{ display: "flex", alignItems: "center" }}
            onChange={handleChange}
            className="tokens"
            name="tokens"
            placeholder="100"
            error={errorLabelsProps.tokens}
          >
            <input />
            <div style={{ margin: "0 0 0 1rem" }}>tJOY</div>
          </Form.Input>
        </Form.Field>
        <Form.Field error={Boolean(errorLabelsProps.destinationAccount)}>
          <LabelWithHelp text="Destination account" help="The account you propose to send the tokens into" />
          <Dropdown
            clearable
            name="destinationAccount"
            labeled
            placeholder="Select Destination Account"
            fluid
            selection
            options={destinationAccounts}
            onChange={handleChange}
            value={ values.destinationAccount }
          />
          {errorLabelsProps.destinationAccount && <Label {...errorLabelsProps.destinationAccount} prompt />}
        </FormField>

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
    tokens: Yup.number().required("You need to specify an amount of tokens."),
    destinationAccount: Yup.string().required("Select a destination account!")
  }),
  handleSubmit: (values: FormValues, { setSubmitting }) => {
    setTimeout(() => {
      console.log(JSON.stringify(values, null, 2));
      setSubmitting(false);
    });
  },
  displayName: "SpendingProposalsForm"
})(SpendingProposalForm);
