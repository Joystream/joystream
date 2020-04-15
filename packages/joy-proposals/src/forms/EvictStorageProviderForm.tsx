import React from "react";
import { FormikProps } from "formik";
import { Form, Icon, Button, Dropdown } from "semantic-ui-react";
import * as Yup from "yup";

import { withFormContainer } from "./FormContainer";
import "./forms.css";

type EvictStorageProviderProps = {
  storageProviders: any[];
};

interface FormValues {
  title: string;
  rationale: string;
}
function EvictStorageProviderForm(props: EvictStorageProviderProps & FormikProps<FormValues>) {
  const { handleChange, storageProviders } = props;
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
        <Dropdown clearable placeholder="Select Storage Provider" fluid selection options={storageProviders} />
        <div className="form-buttons">
          <Button type="submit" color="blue">
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
};

export default withFormContainer<OuterFormProps, FormValues>({
  mapPropsToValues: () => ({
    title: "",
    rationale: ""
  }),
  validationSchema: Yup.object().shape({
    title: Yup.string().required("Title is required!"),
    rationale: Yup.string().required("Rationale is required!")
  }),
  handleSubmit: (values, { setSubmitting }) => {
    setTimeout(() => {
      alert(JSON.stringify(values, null, 2));
      setSubmitting(false);
    }, 1000);
  },
  displayName: "EvictStorageProvidersForm"
})(EvictStorageProviderForm);
