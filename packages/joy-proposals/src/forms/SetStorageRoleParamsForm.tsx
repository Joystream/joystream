import React from "react";
import { Form, Divider } from "semantic-ui-react";
import { getFormErrorLabelsProps } from "./errorHandling";
import * as Yup from "yup";
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
import { InputFormField } from "./FormFields";
import { withFormContainer } from "./FormContainer";
import { BlockNumber, Balance } from "@polkadot/types/interfaces";
import { u32 } from "@polkadot/types/primitive";
import { createType } from "@polkadot/types";
import "./forms.css";

// Move to joy-types?
type RoleParameters = {
  min_stake: Balance;
  min_actors: u32;
  max_actors: u32;
  reward: Balance;
  reward_period: BlockNumber;
  bonding_period: BlockNumber;
  unbonding_period: BlockNumber;
  min_service_period: BlockNumber;
  startup_grace_period: BlockNumber;
  entry_request_fee: Balance;
};

// All of those are strings, because that's how those values are beeing passed from inputs
type FormValues = GenericFormValues &
  {
    [K in keyof RoleParameters]: string;
  };

const defaultValues: FormValues = {
  ...genericFormDefaultValues,
  min_stake: "",
  min_actors: "",
  max_actors: "",
  reward: "",
  reward_period: "",
  bonding_period: "",
  unbonding_period: "",
  min_service_period: "",
  startup_grace_period: "",
  entry_request_fee: ""
};

type FormAdditionalProps = {}; // Aditional props coming all the way from export comonent into the inner form.
type ExportComponentProps = ProposalFormExportProps<FormAdditionalProps, FormValues>;
type FormContainerProps = ProposalFormContainerProps<ExportComponentProps>;
type FormInnerProps = ProposalFormInnerProps<FormContainerProps, FormValues>;

function createRoleParameters(values: FormValues): RoleParameters {
  return {
    min_stake: createType("Balance", values.min_stake),
    min_actors: createType("u32", values.min_actors),
    max_actors: createType("u32", values.max_actors),
    reward: createType("Balance", values.reward),
    reward_period: createType("BlockNumber", values.reward_period),
    bonding_period: createType("BlockNumber", values.bonding_period),
    unbonding_period: createType("BlockNumber", values.unbonding_period),
    min_service_period: createType("BlockNumber", values.min_service_period),
    startup_grace_period: createType("BlockNumber", values.startup_grace_period),
    entry_request_fee: createType("Balance", values.entry_request_fee)
  };
}

const SetStorageRoleParamsForm: React.FunctionComponent<FormInnerProps> = props => {
  const { handleChange, errors, touched, values } = props;
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  return (
    <GenericProposalForm
      {...props}
      txMethod="createSetStorageRoleParametersProposal"
      proposalType="SetStorageRoleParameters"
      submitParams={[props.myMemberId, values.title, values.rationale, "{STAKE}", createRoleParameters(values)]}
    >
      <Divider horizontal>Parameters</Divider>
      <Form.Group widths="equal" style={{ marginBottom: "2em" }}>
        <InputFormField
          label="Min. actors"
          help="Minimum number of actors in this role"
          onChange={handleChange}
          name="min_actors"
          placeholder="5"
          error={errorLabelsProps.min_actors}
          value={values.min_actors}
        />
        <InputFormField
          label="Max. actors"
          help="Maximum number of actors in this role"
          fluid
          onChange={handleChange}
          name="max_actors"
          placeholder="20"
          error={errorLabelsProps.max_actors}
          value={values.max_actors}
        />
      </Form.Group>
      <Form.Group widths="equal" style={{ marginBottom: "2em" }}>
        <InputFormField
          label="Reward"
          help="Reward for performing this role (for each period)"
          fluid
          onChange={handleChange}
          name="reward"
          placeholder="10"
          error={errorLabelsProps.reward}
          value={values.reward}
          unit="tJOY"
        />
        <InputFormField
          label="Reward period"
          help="Reward period in blocks"
          fluid
          onChange={handleChange}
          name="reward_period"
          placeholder="600"
          error={errorLabelsProps.reward_period}
          value={values.reward_period}
          unit="blocks"
        />
      </Form.Group>
      <Form.Group widths="equal" style={{ marginBottom: "2em" }}>
        <InputFormField
          label="Min. stake"
          help="Minimum stake for this role"
          onChange={handleChange}
          name="min_stake"
          placeholder="3000"
          error={errorLabelsProps.min_stake}
          value={values.min_stake}
          unit="tJOY"
        />
        <InputFormField
          label="Min. service period"
          help="Minimum period of service in blocks"
          fluid
          onChange={handleChange}
          name="min_service_period"
          placeholder="600"
          error={errorLabelsProps.min_service_period}
          value={values.min_service_period}
          unit="blocks"
        />
      </Form.Group>
      <Form.Group widths="equal" style={{ marginBottom: "2em" }}>
        <InputFormField
          label="Bonding period"
          help="Bonding period in blocks"
          fluid
          onChange={handleChange}
          name="bonding_period"
          placeholder="600"
          error={errorLabelsProps.bonding_period}
          value={values.bonding_period}
          unit="blocks"
        />
        <InputFormField
          label="Unbounding period"
          help="Unbounding period in blocks"
          fluid
          onChange={handleChange}
          name="unbonding_period"
          placeholder="600"
          error={errorLabelsProps.unbonding_period}
          value={values.unbonding_period}
          unit="blocks"
        />
      </Form.Group>
      <Form.Group widths="equal" style={{ marginBottom: "2em" }}>
        <InputFormField
          label="Startup grace period"
          help="Startup grace period in blocks"
          fluid
          onChange={handleChange}
          name="startup_grace_period"
          placeholder="600"
          error={errorLabelsProps.startup_grace_period}
          value={values.startup_grace_period}
          unit="blocks"
        />
        <InputFormField
          label="Entry request fee"
          help="Entry request fee"
          fluid
          onChange={handleChange}
          name="entry_request_fee"
          placeholder="100"
          error={errorLabelsProps.entry_request_fee}
          value={values.entry_request_fee}
          unit="tJOY"
        />
      </Form.Group>
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
    min_stake: Validation.SetStorageRoleParameters.min_stake,
    min_actors: Validation.SetStorageRoleParameters.min_actors,
    max_actors: Validation.SetStorageRoleParameters.max_actors,
    reward: Validation.SetStorageRoleParameters.reward,
    reward_period: Validation.SetStorageRoleParameters.reward_period,
    bonding_period: Validation.SetStorageRoleParameters.bonding_period,
    unbonding_period: Validation.SetStorageRoleParameters.unbonding_period,
    min_service_period: Validation.SetStorageRoleParameters.min_service_period,
    startup_grace_period: Validation.SetStorageRoleParameters.startup_grace_period,
    entry_request_fee: Validation.SetStorageRoleParameters.entry_request_fee
  }),
  handleSubmit: genericFormDefaultOptions.handleSubmit,
  displayName: "SetStorageRoleParamsForm"
})(SetStorageRoleParamsForm);

export default withProposalFormData(FormContainer);
