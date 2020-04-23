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
} from './GenericProposalForm';
import { FormField } from './FormFields';
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
    <GenericProposalForm {...props}>
        <FormField
          error={errorLabelsProps.storageProvider}
          label="Storage provider"
          help="The storage provider you propose to evict">
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
  handleSubmit: genericFormDefaultOptions.handleSubmit,
  displayName: "EvictStorageProvidersForm"
})(EvictStorageProviderForm);
