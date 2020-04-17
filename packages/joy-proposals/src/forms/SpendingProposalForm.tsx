import React from "react";
import { FormikProps } from "formik";
import { Form, Icon, Button, Dropdown } from "semantic-ui-react";
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
  const { handleChange, destinationAccounts } = props;
  return (
    <div className="Forms">
      <Form className="proposal-form">
        <Form.Input
          onChange={handleChange}
          label="Title"
          name="title"
          placeholder="Title for your awesome proposal..."
        />
        <Form.TextArea
          onChange={handleChange}
          label="Rationale"
          name="rationale"
          placeholder="This proposal is awesome because..."
        />
        <div style={{ display: "flex" }}>
          <Form.Input
            onChange={handleChange}
            className="tokens"
            label="Amount of tokens"
            name="tokens"
            placeholder="100"
          />
          <div style={{ margin: "2.5rem 0 2.5rem 1rem" }}>tJOY</div>
        </div>
        <Form.Field>
          <label>Destination Account</label>
          <Dropdown
            clearable
            name="destinationAccount"
            labeled
            placeholder="Select Destination Account"
            fluid
            selection
            options={destinationAccounts}
          />
        </Form.Field>

        <div className="form-buttons">
          <Button type="submit" color="blue">
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
    tokens: 0
  }),
  validationSchema: Yup.object().shape({
    title: Yup.string().required("Title is required!"),
    rationale: Yup.string().required("Rationale is required!"),
    tokens: Yup.number().required("You need to specify an amount of tokens."),
    destinationAccount: Yup.string()
  }),
  handleSubmit: (values, { setSubmitting }) => {
    console.log(JSON.stringify(values, null, 2));
    setSubmitting(false);
  },
  displayName: "SpendingProposalsForm"
})(SpendingProposalForm);
