import React from "react";
import { getFormErrorLabelsProps } from "./errorHandling";
import * as Yup from "yup";
import { Label } from "semantic-ui-react";
import {
  GenericProposalForm,
  GenericFormValues,
  genericFormDefaultOptions,
  genericFormDefaultValues,
  withProposalFormData,
  ProposalFormExportProps,
  ProposalFormContainerProps,
  ProposalFormInnerProps
} from "./GenericProposalForm";
import { FormField } from "./FormFields";
import { withFormContainer } from "./FormContainer";
import { InputAddress } from '@polkadot/react-components/index';
import { accountIdsToOptions } from "@polkadot/joy-election/utils";
import { createType } from '@polkadot/types';
import "./forms.css";

type FormValues = GenericFormValues & {
  storageProvider: any;
};

const defaultValues: FormValues = {
  ...genericFormDefaultValues,
  storageProvider: ""
};

type FormAdditionalProps = {}; // Aditional props coming all the way from export comonent into the inner form.
type ExportComponentProps = ProposalFormExportProps<FormAdditionalProps, FormValues>;
type FormContainerProps = ProposalFormContainerProps<ExportComponentProps>;
type FormInnerProps = ProposalFormInnerProps<FormContainerProps, FormValues>;

const EvictStorageProviderForm: React.FunctionComponent<FormInnerProps> = props => {
  const { errors, touched, values, setFieldValue } = props;
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  const storageProvidersOptions = accountIdsToOptions([
    createType("AccountId", "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY") // Alice
  ]); // TODO: Fetch real storage providers!
  return (
    <GenericProposalForm
      {...props}
      txMethod="createEvictStorageProviderProposal"
      requiredStakePercent={0.1}
      submitParams={[
        props.myMemberId,
        values.title,
        values.rationale,
        '{STAKE}',
        values.storageProvider
      ]}
    >

      <FormField
        error={errorLabelsProps.storageProvider}
        label="Storage provider"
        help="The storage provider you propose to evict"
      >
        <InputAddress
          onChange={(address) => setFieldValue("storageProvider", address) }
          type="address"
          placeholder="Select storage provider"
          value={values.storageProvider}
          options={storageProvidersOptions}
        />
        {errorLabelsProps.storageProvider && <Label {...errorLabelsProps.storageProvider} prompt />}
      </FormField>
    </GenericProposalForm>
  );
};

const FormContainer = withFormContainer<FormContainerProps, FormValues>({
  mapPropsToValues: (props: FormContainerProps) => ({
    ...defaultValues,
    ...(props.initialData || {})
  }),
  validationSchema: Yup.object().shape({
    ...genericFormDefaultOptions.validationSchema,
    storageProvider: Yup.string().nullable().required("Select a storage provider!")
  }),
  handleSubmit: genericFormDefaultOptions.handleSubmit,
  displayName: "EvictStorageProvidersForm"
})(EvictStorageProviderForm);

export default withProposalFormData<FormContainerProps, ExportComponentProps>(FormContainer);
