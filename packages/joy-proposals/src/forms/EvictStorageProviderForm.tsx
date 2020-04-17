import React from 'react';
import { FormikProps } from 'formik';
import { Form, Icon, Button, Dropdown } from 'semantic-ui-react';
import * as Yup from 'yup';

import { withFormContainer } from './FormContainer';
import './forms.css';

type EvictStorageProviderProps = {
  storageProviders: any[];
};

interface FormValues {
  title: string;
  rationale: string;
  storageProvider: any;
}
function EvictStorageProviderForm (props: EvictStorageProviderProps & FormikProps<FormValues>) {
  const { handleChange, handleSubmit, isSubmitting, storageProviders } = props;
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
        <Form.Field>
          <label>Storage Provider</label>
          <Dropdown
            clearable
            name="storageProvider"
            placeholder="Select Storage Provider"
            fluid
            selection
            options={storageProviders}
          />
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
} & EvictStorageProviderProps;

export default withFormContainer<OuterFormProps, FormValues>({
  mapPropsToValues: () => ({
    title: '',
    rationale: ''
  }),
  validationSchema: Yup.object().shape({
    title: Yup.string().required('Title is required!'),
    rationale: Yup.string().required('Rationale is required!')
  }),
  handleSubmit: (values, { setSubmitting, resetForm }) => {
    setTimeout(() => {
      alert(JSON.stringify(values, null, 2));
      resetForm({});
      setSubmitting(false);
    }, 1000);
  },
  displayName: 'EvictStorageProvidersForm'
})(EvictStorageProviderForm);
