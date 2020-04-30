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
import Validation from "../validationSchema";
import { InputFormField, FormField } from "./FormFields";
import { withFormContainer } from "./FormContainer";
import { InputAddress } from "@polkadot/react-components/index";
import { accountIdsToOptions } from "@polkadot/joy-election/utils";
import { createType } from "@polkadot/types";
import "./forms.css";

type FormValues = GenericFormValues & {
  destinationAccount: any;
  tokens: string;
};

const defaultValues: FormValues = {
  ...genericFormDefaultValues,
  destinationAccount: "",
  tokens: ""
};

type FormAdditionalProps = {}; // Aditional props coming all the way from export comonent into the inner form.
type ExportComponentProps = ProposalFormExportProps<FormAdditionalProps, FormValues>;
type FormContainerProps = ProposalFormContainerProps<ExportComponentProps>;
type FormInnerProps = ProposalFormInnerProps<FormContainerProps, FormValues>;

const SpendingProposalForm: React.FunctionComponent<FormInnerProps> = props => {
  const { handleChange, errors, touched, values, setFieldValue } = props;
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  const destinationAccountsOptions = accountIdsToOptions([
    createType("AccountId", "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY") // Alice
  ]); // TODO: Fetch real destination addresses!
  return (
    <GenericProposalForm
      {...props}
      txMethod="createSpendingProposal"
      requiredStakePercent={0.25}
      submitParams={[
        props.myMemberId,
        values.title,
        values.rationale,
        "{STAKE}",
        values.tokens,
        values.destinationAccount
      ]}
    >
      <InputFormField
        label="Amount of tokens"
        help="The amount of tokens you propose to spend"
        onChange={handleChange}
        className="tokens"
        name="tokens"
        placeholder="100"
        error={errorLabelsProps.tokens}
        unit={"tJOY"}
        value={values.tokens}
      />
      <FormField
        error={errorLabelsProps.destinationAccount}
        label="Destination account"
        help="The account you propose to send the tokens into"
      >
        <InputAddress
          onChange={address => setFieldValue("destinationAccount", address)}
          type="address"
          placeholder="Select Destination Account"
          value={values.destinationAccount}
          options={destinationAccountsOptions}
        />
        {errorLabelsProps.destinationAccount && <Label {...errorLabelsProps.destinationAccount} prompt />}
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
    tokens: Validation.Spending.tokens,
    destinationAccount: Validation.Spending.destinationAccount
  }),
  handleSubmit: genericFormDefaultOptions.handleSubmit,
  displayName: "SpendingProposalsForm"
})(SpendingProposalForm);

export default withProposalFormData<FormContainerProps, ExportComponentProps>(FormContainer);
