import React from "react";
import { FormikProps } from "formik";
import { Form, Divider } from "semantic-ui-react";
import { getFormErrorLabelsProps } from "./errorHandling";
import * as Yup from "yup";
import {
  GenericProposalForm,
  GenericFormValues,
  genericFormDefaultOptions,
  DefaultOuterFormProps,
  genericFormDefaultValues
} from "./GenericProposalForm";
import FormField from "./FormField";
import { withFormContainer } from "./FormContainer";
import "./forms.css";

// All of those are strings, because that's how those values are beeing passed from inputs
type FormValues = GenericFormValues & {
  storageProviderCount: string;
  storageProviderReward: string;
  storageProviderStakingLimit: string;
};

const defaultValues: FormValues = {
  ...genericFormDefaultValues,
  storageProviderCount: "",
  storageProviderReward: "",
  storageProviderStakingLimit: ""
};

type FormAdditionalProps = {};
type SetStorageRoleParamsFormProps = FormikProps<FormValues> & FormAdditionalProps;

const SetStorageRoleParamsForm: React.FunctionComponent<SetStorageRoleParamsFormProps> = props => {
  const { handleChange, handleSubmit, isSubmitting, errors, touched } = props;
  const passProps = { handleChange, errors, isSubmitting, touched, handleSubmit };
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  return (
    <GenericProposalForm {...passProps}>
      <Divider horizontal>Parameters</Divider>
      <Form.Group widths="equal" style={{ marginBottom: "8rem" }}>
        <FormField
          label="Providers Count"
          help="The proposed maximum number of active Storage Providers"
          onChange={handleChange}
          name="storageProviderCount"
          placeholder="10"
          error={errorLabelsProps.storageProviderCount}
        />
        <FormField
          label="Provider Reward"
          help="The proposed reward for Storage Providers (every x blocks)"
          onChange={handleChange}
          name="storageProviderReward"
          placeholder="50"
          error={errorLabelsProps.storageProviderReward}
          unit={"tJOY"}
        />
        <FormField
          label="Staking Limit"
          help="The minimum stake for Storage Providers"
          onChange={handleChange}
          name="storageProviderStakingLimit"
          placeholder="1500"
          error={errorLabelsProps.storageProviderStakingLimit}
          unit={"tJOY"}
        />
      </Form.Group>
    </GenericProposalForm>
  );
};

type OuterFormProps = DefaultOuterFormProps<FormAdditionalProps, FormValues>;

export default withFormContainer<OuterFormProps, FormValues>({
  mapPropsToValues: (props: OuterFormProps) => ({
    ...defaultValues,
    ...(props.initialData || {})
  }),
  validationSchema: Yup.object().shape({
    ...genericFormDefaultOptions.validationSchema,
    storageProviderCount: Yup.number().required("Enter the provider count"),
    storageProviderReward: Yup.number().required("Enter the reward"),
    storageProviderStakingLimit: Yup.number().required("Enter the provider staking limit")
  }),
  handleSubmit: genericFormDefaultOptions.handleSubmit,
  displayName: "SetStorageRoleParamsForm"
})(SetStorageRoleParamsForm);
