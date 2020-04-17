import React from "react";
import { FormikProps } from "formik";
import { Form, Icon, Button, Dropdown, Label } from "semantic-ui-react";
import { getFormErrorLabelsProps } from "./errorHandling";
import * as Yup from "yup";

import { withFormContainer } from "./FormContainer";
import "./forms.css";

type SpendingProposalProps = {
  destinationAccounts: any[];
};

interface FormValues {
  title: string;
  rationale: string;
  destinationAccount: any;
  tokens: number;
}

function SpendingProposalForm(props: SpendingProposalProps & FormikProps<FormValues>) {
  const { handleChange, destinationAccounts, errors, isSubmitting, touched, handleSubmit } = props;
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  return (
    <div className="Forms">
      <Form className="proposal-form" onSubmit={handleSubmit}>
        <Form.Input
          onChange={handleChange}
          label="Title"
          name="title"
          placeholder="Title for your awesome proposal..."
          error={errorLabelsProps.title}
        />
        <Form.TextArea
          onChange={handleChange}
          label="Rationale"
          name="rationale"
          placeholder="This proposal is awesome because..."
          error={errorLabelsProps.rationale}
        />
        <Form.Input
          style={{ display: "flex", alignItems: "center" }}
          onChange={handleChange}
          className="tokens"
          label="Amount of tokens"
          name="tokens"
          placeholder="100"
          error={errorLabelsProps.tokens}
        >
          <input />
          <div style={{ margin: "0 0 0 1rem" }}>tJOY</div>
        </Form.Input>
        <Form.Field error={Boolean(errorLabelsProps.destinationAccount)}>
          <label>Destination Account</label>
          <Dropdown
            clearable
            name="destinationAccount"
            labeled
            placeholder="Select Destination Account"
            fluid
            selection
            options={destinationAccounts}
            onChange={handleChange}
          />
          {errorLabelsProps.destinationAccount && <Label {...errorLabelsProps.destinationAccount} prompt />}
        </Form.Field>

        <div className="form-buttons">
          <Button type="submit" color="blue" loading={isSubmitting}>
            <Icon name="paper plane" />
            Submit
          </Button>
          <Button color="grey" icon="times">
            <Icon name="times" />
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  );
}

type OuterFormProps = {
  initialTitle?: string;
  initialRationale?: string;
  initialTokens?: number;
} & SpendingProposalProps;

export default withFormContainer<OuterFormProps, FormValues>({
  mapPropsToValues: () => ({
    title: "",
    rationale: "",
    tokens: "",
    destinationAccount: ""
  }),
  validationSchema: Yup.object().shape({
    title: Yup.string().required("Title is required!"),
    rationale: Yup.string().required("Rationale is required!"),
    tokens: Yup.number().required("You need to specify an amount of tokens."),
    destinationAccount: Yup.string().required("Select a destination account!")
  }),
  handleSubmit: (values, { setSubmitting }) => {
    setTimeout(() => {
      console.log(JSON.stringify(values, null, 2));
      setSubmitting(false);
    });
  },
  displayName: "SpendingProposalsForm"
})(SpendingProposalForm);
