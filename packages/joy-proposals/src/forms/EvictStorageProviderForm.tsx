import React from "react";
import { FormikProps } from "formik";
import { getFormErrorLabelsProps } from "./errorHandling";
import * as Yup from "yup";
import LabelWithHelp from "./LabelWithHelp";

import { withFormContainer } from "./FormContainer";
import "./forms.css";


type FormValues = GenericFormValues & {
  storageProvider: any
};

const defaultValues:FormValues = {
  ...genericFormDefaultValues,
  storageProvider: ''
}

type FormAdditionalProps = {
  storageProviders: any[],
};
type EvictStorageProviderFormProps = FormikProps<FormValues> & FormAdditionalProps;

const EvictStorageProviderForm: React.FunctionComponent<EvictStorageProviderFormProps> = props => {
  const { handleChange, storageProviders, errors, touched, values } = props;
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
        <Form.Field error={Boolean(errorLabelsProps.storageProvider)}>
          <LabelWithHelp text="Storage provider" help="The storage provider you propose to evict" />
          <Dropdown
            clearable
            name="storageProvider"
            placeholder="Select Storage Provider"
            fluid
            selection
            options={storageProviders}
            onChange={handleChange}
            value={values.storageProvider}
          />
          {errorLabelsProps.storageProvider && <Label {...errorLabelsProps.storageProvider} prompt />}
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
    storageProvider: Yup.string().required("Select a storage provider!")
  }),
  handleSubmit: (values: FormValues, { setSubmitting, resetForm }: { [k: string]: any }) => {
    setTimeout(() => {
      alert(JSON.stringify(values, null, 2));
      resetForm({});
      setSubmitting(false);
    }, 1000);
  },
  displayName: "EvictStorageProvidersForm"
})(EvictStorageProviderForm);
