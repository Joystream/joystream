import React from "react";
import { FormikProps } from "formik";
import { Form, Icon, Button, Dropdown } from "semantic-ui-react";
import * as Yup from "yup";

import { withFormContainer } from "./FormContainer";
import "./forms.css";

type MintCapacityProps = {
  handleClear: () => void;
};

interface FormValues {
  title: string;
  rationale: string;
  capacity: number;
}

function MintCapacityForm(props: MintCapacityProps & FormikProps<FormValues>) {
  const { handleChange, handleSubmit, isSubmitting } = props;
  return (
    <div className="Forms">
      <Form className="proposal-form" onSubmit={handleSubmit}>
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
            className="capacity"
            label="New Mint Capacity"
            name="capacity"
            placeholder="100"
          />
          <div style={{ margin: "2.5rem 0 2.5rem 1rem" }}>tJOY</div>
        </div>

        <div className="form-buttons">
          <Button type="submit" color="blue" loading={isSubmitting}>
            <Icon name="paper plane" />
            Submit
          </Button>
          <Button color="grey" icon="times" type="button">
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
  initialCapacity?: number;
} & MintCapacityProps;

export default withFormContainer<OuterFormProps, FormValues>({
  mapPropsToValues: () => ({
    title: "",
    rationale: "",
    capacity: 0
  }),
  validationSchema: Yup.object().shape({
    title: Yup.string().required("Title is required!"),
    rationale: Yup.string().required("Rationale is required!"),
    capacity: Yup.number().required("You need to specify a mint capacity for the council."),
    destinationAccount: Yup.string()
  }),
  handleSubmit: (values, { setSubmitting }) => {
    setTimeout(() => {
      console.log(JSON.stringify(values, null, 2));

      setSubmitting(false);
    }, 1000);
  },
  displayName: "MintCapacityForm"
})(MintCapacityForm);
