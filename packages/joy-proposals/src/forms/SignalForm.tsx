import React from "react";
import { FormikProps } from "formik";
import { Form, Icon, Button } from "semantic-ui-react";
import { getFormErrorLabelsProps } from "./errorHandling";
import * as Yup from "yup";

import { withFormContainer } from "./FormContainer";
import "./forms.css";

type SignalFormProps = {};

interface FormValues {
  title: string;
  rationale: string;
  description: string;
}

function SignalForm(props: SignalFormProps & FormikProps<FormValues>) {
  const { handleChange, errors, touched, isSubmitting, handleSubmit } = props;
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
          label="Description"
          name="description"
          placeholder="What I would like to propose is..."
          error={errorLabelsProps.description}
        />
        <Form.TextArea
          onChange={handleChange}
          label="Rationale"
          name="rationale"
          placeholder="This proposal is awesome because..."
          error={errorLabelsProps.rationale}
        />
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
  initialDescription?: string;
};

export default withFormContainer<OuterFormProps, FormValues>({
  mapPropsToValues: () => ({
    title: "",
    description: "",
    rationale: ""
  }),
  validationSchema: Yup.object().shape({
    title: Yup.string().required("Title is required!"),
    rationale: Yup.string().required("Rationale is required!"),
    description: Yup.string().required("Description is required!")
  }),
  handleSubmit: (values, { setSubmitting }) => {
    setTimeout(() => {
      alert(JSON.stringify(values, null, 2));
      setSubmitting(false);
    }, 1000);
  },
  displayName: "SignalForm"
})(SignalForm);
