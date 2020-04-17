import React from "react";
import { FormikProps } from "formik";
import { Form, Icon, Button, Dropdown } from "semantic-ui-react";
import * as Yup from "yup";
import { getFormErrorLabelsProps } from "./errorHandling";
import LabelWithHelp from './LabelWithHelp';

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
  const { handleChange, errors, touched, isSubmitting, handleSubmit } = props;
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  return (
    <div className="Forms">
      <Form className="proposal-form" onSubmit={handleSubmit}>
        <Form.Field error={Boolean(errorLabelsProps.title)}>
          <LabelWithHelp text="Title" help="The title of your proposal"/>
          <Form.Input
            onChange={handleChange}
            name="title"
            placeholder="Title for your awesome proposal..."
            error={errorLabelsProps.title}
          />
        </Form.Field>
        <Form.Field error={Boolean(errorLabelsProps.rationale)}>
          <LabelWithHelp text="Rationale" help="The rationale behind your proposal"/>
          <Form.TextArea
            onChange={handleChange}
            name="rationale"
            placeholder="This proposal is awesome because..."
            error={errorLabelsProps.rationale}
          />
        </Form.Field>
        <Form.Field error={Boolean(errorLabelsProps.capacity)}>
          <LabelWithHelp text="New Mint Capacity" help="The new mint capacity you propse"/>
          <Form.Input
            style={{ display: "flex", alignItems: "center" }}
            onChange={handleChange}
            className="capacity"
            name="capacity"
            placeholder="100"
            error={errorLabelsProps.capacity}
          >
            <input />
            <div style={{ margin: "0 0 0 1rem" }}>tJOY</div>
          </Form.Input>
        </Form.Field>

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
