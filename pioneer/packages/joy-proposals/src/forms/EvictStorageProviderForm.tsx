import React from "react";
import { getFormErrorLabelsProps } from "./errorHandling";
import * as Yup from "yup";
import { Label, Loader } from "semantic-ui-react";
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
import Validation from "../validationSchema";
import { FormField } from "./FormFields";
import { withFormContainer } from "./FormContainer";
import { InputAddress } from "@polkadot/react-components/index";
import { accountIdsToOptions } from "@polkadot/joy-election/utils";
import { AccountId } from "@polkadot/types/interfaces";
import { useTransport, usePromise } from "@polkadot/joy-utils/react/hooks";
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
  const transport = useTransport();
  const [storageProviders /* error */, , loading] = usePromise<AccountId[]>(() => transport.storageProviders.providers(), []);
  const storageProvidersOptions = accountIdsToOptions(storageProviders);
  return (
    <GenericProposalForm
      {...props}
      txMethod="createEvictStorageProviderProposal"
      proposalType="EvictStorageProvider"
      submitParams={[props.myMemberId, values.title, values.rationale, "{STAKE}", values.storageProvider]}
    >
      {loading ? (
        <>
          <Loader active inline style={{ marginRight: "5px" }} /> Fetching storage providers...
        </>
      ) : (
        <FormField
          error={errorLabelsProps.storageProvider}
          label="Storage provider"
          help="The storage provider you propose to evict"
        >
          <InputAddress
            onChange={address => setFieldValue("storageProvider", address)}
            type="address"
            placeholder="Select storage provider"
            value={values.storageProvider}
            options={storageProvidersOptions}
          />
          {errorLabelsProps.storageProvider && <Label {...errorLabelsProps.storageProvider} prompt />}
        </FormField>
      )}
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
    storageProvider: Validation.EvictStorageProvider.storageProvider
  }),
  handleSubmit: genericFormDefaultOptions.handleSubmit,
  displayName: "EvictStorageProvidersForm"
})(EvictStorageProviderForm);

export default withProposalFormData<FormContainerProps, ExportComponentProps>(FormContainer);
