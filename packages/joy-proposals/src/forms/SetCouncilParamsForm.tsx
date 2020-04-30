import React from "react";
import { getFormErrorLabelsProps } from "./errorHandling";
import { Divider, Form } from "semantic-ui-react";
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

type FormValues = GenericFormValues & {
  announcingPeriod: string;
  votingPeriod: string;
  minVotingStake: string;
  revealingPeriod: string;
  minCouncilStake: string;
  newTermDuration: string;
  candidacyLimit: string;
  councilSize: string;
};

const defaultValues: FormValues = {
  ...genericFormDefaultValues,
  announcingPeriod: "",
  votingPeriod: "",
  minVotingStake: "",
  revealingPeriod: "",
  minCouncilStake: "",
  newTermDuration: "",
  candidacyLimit: "",
  councilSize: ""
};

type FormAdditionalProps = {}; // Aditional props coming all the way from export comonent into the inner form.
type ExportComponentProps = ProposalFormExportProps<FormAdditionalProps, FormValues>;
type FormContainerProps = ProposalFormContainerProps<ExportComponentProps>;
type FormInnerProps = ProposalFormInnerProps<FormContainerProps, FormValues>;

const expectedBlockTimeMs = 6000; // TODO: api.consts.babe.expectedBlockTime;
const daysToBlocks = (days: number) => (days * 24 * 60 * 60 * 1000) / expectedBlockTimeMs;

// TODO: Define in joy-types?
type ElectionParameters = {
  announcing_period: BlockNumber;
  voting_period: BlockNumber;
  revealing_period: BlockNumber;
  council_size: u32;
  candidacy_limit: u32;
  new_term_duration: BlockNumber;
  min_council_stake: Balance;
  min_voting_stake: Balance;
};

function createElectionParameters(values: FormValues): ElectionParameters {
  return {
    announcing_period: createType("BlockNumber", daysToBlocks(parseInt(values.announcingPeriod))),
    voting_period: createType("BlockNumber", daysToBlocks(parseInt(values.votingPeriod))),
    revealing_period: createType("BlockNumber", daysToBlocks(parseInt(values.revealingPeriod))),
    council_size: createType("u32", values.councilSize),
    candidacy_limit: createType("u32", values.candidacyLimit),
    new_term_duration: createType("BlockNumber", daysToBlocks(parseInt(values.newTermDuration))),
    min_council_stake: createType("Balance", values.minCouncilStake),
    min_voting_stake: createType("Balance", values.minVotingStake)
  };
}

const SetCouncilParamsForm: React.FunctionComponent<FormInnerProps> = props => {
  const { handleChange, errors, touched, values } = props;
  const errorLabelsProps = getFormErrorLabelsProps<FormValues>(errors, touched);
  return (
    <GenericProposalForm
      {...props}
      txMethod="createSetElectionParametersProposal"
      requiredStakePercent={0.75}
      submitParams={[props.myMemberId, values.title, values.rationale, "{STAKE}", createElectionParameters(values)]}
    >
      <Divider horizontal>Voting </Divider>
      <Form.Group widths="equal" style={{ marginBottom: "8rem" }}>
        <InputFormField
          label="Announcing Period"
          help="Announcing period in days"
          onChange={handleChange}
          name="announcingPeriod"
          placeholder="3"
          error={errorLabelsProps.announcingPeriod}
          value={values.announcingPeriod}
        />
        <InputFormField
          label="Voting Period"
          help="Voting period in days"
          onChange={handleChange}
          name="votingPeriod"
          placeholder="1"
          error={errorLabelsProps.votingPeriod}
          value={values.votingPeriod}
        />
        <InputFormField
          label="Revealing Period"
          help="Revealing period in days"
          fluid
          onChange={handleChange}
          name="revealingPeriod"
          placeholder="1"
          error={errorLabelsProps.revealingPeriod}
          value={values.revealingPeriod}
        />
        <InputFormField
          label="Minimum Voting Stake"
          help="The minimum voting stake"
          fluid
          onChange={handleChange}
          name="minVotingStake"
          placeholder="100"
          error={errorLabelsProps.minVotingStake}
          value={values.minVotingStake}
        />
      </Form.Group>
      <Divider horizontal>Council</Divider>
      <Form.Group widths="equal" style={{ marginBottom: "8rem" }}>
        <InputFormField
          label="Minimum Council Stake"
          help="The minimum council stake"
          fluid
          onChange={handleChange}
          name="minCouncilStake"
          placeholder="1000"
          error={errorLabelsProps.minCouncilStake}
          value={values.minCouncilStake}
        />
        <InputFormField
          label="New Term Duration"
          help="Duration of the new term in days"
          fluid
          onChange={handleChange}
          name="newTermDuration"
          placeholder="14"
          error={errorLabelsProps.newTermDuration}
          value={values.newTermDuration}
        />
        <InputFormField
          label="Council Size"
          help="The size of the council (number of seats)"
          fluid
          onChange={handleChange}
          name="councilSize"
          placeholder="12"
          error={errorLabelsProps.councilSize}
          value={values.councilSize}
        />
        <InputFormField
          label="Candidacy Limit"
          help="How many members can candidate"
          fluid
          onChange={handleChange}
          name="candidacyLimit"
          placeholder="25"
          error={errorLabelsProps.candidacyLimit}
          value={values.candidacyLimit}
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
    announcingPeriod: Validation.SetElectionParameters.announcingPeriod,
    votingPeriod: Validation.SetElectionParameters.votingPeriod,
    minVotingStake: Validation.SetElectionParameters.minVotingStake,
    revealingPeriod: Validation.SetElectionParameters.revealingPeriod,
    minCouncilStake: Validation.SetElectionParameters.minCouncilStake,
    newTermDuration: Validation.SetElectionParameters.newTermDuration,
    candidacyLimit: Validation.SetElectionParameters.candidacyLimit,
    councilSize: Validation.SetElectionParameters.councilSize
  }),
  handleSubmit: genericFormDefaultOptions.handleSubmit,
  displayName: "SetCouncilParamsForm"
})(SetCouncilParamsForm);

export default withProposalFormData<FormContainerProps, ExportComponentProps>(FormContainer);
