import { ProposalType } from "./runtime";
import * as Yup from "yup";
import { StringSchema, NumberSchema } from "@types/yup";

type ValidationType = {
  All: {
    title: StringSchema<string>;
    rationale: StringSchema<string>;
  };
  Text: {
    description: StringSchema<string>;
  };
  RuntimeUpgrade: {
    WASM: StringSchema;
  };
  SetElectionParameters: {
    announcingPeriod: NumberSchema<number>;
    votingPeriod: NumberSchema<number>;
    minVotingStake: NumberSchema<number>;
    revealingPeriod: NumberSchema<number>;
    minCouncilStake: NumberSchema<number>;
    newTermDuration: NumberSchema<number>;
    candidacyLimit: NumberSchema<number>;
    councilSize: NumberSchema<number>;
  };
  Spending: {
    tokens: NumberSchema<number>;
    destinationAccount: StringSchema<string>;
  };
  SetLead: {
    workingGroupLead: StringSchema<string>;
  };
  SetContentWorkingGroupMintCapacity: {};
  EvictStorageProvider: {
    storageProvider: StringSchema<string | null>;
  };
  SetValidatorCount: {
    maxValidatorCount: NumberSchema<number>;
  };
  SetStorageRoleParameters: {
    min_stake: NumberSchema<number>;
    min_actors: NumberSchema<number>;
    max_actors: NumberSchema<number>;
    reward: NumberSchema<number>;
    reward_period: NumberSchema<number>;
    bonding_period: NumberSchema<number>;
    unbonding_period: NumberSchema<number>;
    min_service_period: NumberSchema<number>;
    startup_grace_period: NumberSchema<number>;
    entry_request_fee: NumberSchema<number>;
  };
};
/*
Validation is used to validate a proposal form.
Each proposal type should validate the fields of his form, anything is valid as long as it fits in a Yup Schema.
In a form, validation should be injected in the Yup Schema just by accessing it in this object.
Ex:
// EvictStorageProvider Form

import Validation from 'path/to/validationSchema'
...
  validationSchema: Yup.object().shape({
    ...genericFormDefaultOptions.validationSchema,
    storageProvider: Validation.EvictStorageProvider.storageProvider
  }),

*/
const Validation: ValidationType = {
  All: {
    title: Yup.string().required("Title is required!"),
    rationale: Yup.string().required("Rationale is required!")
  },
  Text: {
    description: Yup.string().required("Description is required!")
  },
  RuntimeUpgrade: {
    WASM: Yup.string().required("The file is empty!")
  },
  SetElectionParameters: {
    announcingPeriod: Yup.number().required("All fields must be filled!"),
    votingPeriod: Yup.number().required("All fields must be filled!"),
    minVotingStake: Yup.number().required("All fields must be filled!"),
    revealingPeriod: Yup.number().required("All fields must be filled!"),
    minCouncilStake: Yup.number().required("All fields must be filled!"),
    newTermDuration: Yup.number().required("All fields must be filled!"),
    candidacyLimit: Yup.number().required("All fields must be filled!"),
    councilSize: Yup.number().required("All fields must be filled!")
  },
  Spending: {
    tokens: Yup.number().required("You need to specify an amount of tokens."),
    destinationAccount: Yup.string().required("Select a destination account!")
  },
  SetLead: {
    workingGroupLead: Yup.string().required("Select a proposed lead!")
  },
  SetContentWorkingGroupMintCapacity: {},
  EvictStorageProvider: {
    storageProvider: Yup.string()
      .nullable()
      .required("Select a storage provider!")
  },
  SetValidatorCount: {
    maxValidatorCount: Yup.number().required("Enter the max validator count")
  },
  SetStorageRoleParameters: {
    min_stake: Yup.number().required("All parameters are required"),
    min_actors: Yup.number().required("All parameters are required"),
    max_actors: Yup.number().required("All parameters are required"),
    reward: Yup.number().required("All parameters are required"),
    reward_period: Yup.number().required("All parameters are required"),
    bonding_period: Yup.number().required("All parameters are required"),
    unbonding_period: Yup.number().required("All parameters are required"),
    min_service_period: Yup.number().required("All parameters are required"),
    startup_grace_period: Yup.number().required("All parameters are required"),
    entry_request_fee: Yup.number().required("All parameters are required")
  }
};

export default Validation;
