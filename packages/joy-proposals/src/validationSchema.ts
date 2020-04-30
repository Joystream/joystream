import * as Yup from "yup";
import { StringSchema, NumberSchema } from "@types/yup";
import { checkAddress } from "@polkadot/util-crypto";

const ANNOUNCING_PERIOD_MAX = 23000;
const ANNOUNCING_PERIOD_MIN = 48000;
const VOTING_PERIOD_MIN = 23000;
const VOTING_PERIOD_MAX = 48000;
const MIN_VOTING_STAKE_MIN = 23000;
const MIN_VOTING_STAKE_MAX = 49000;
const REVEALING_PERIOD_MIN = 23000;
const REVEALING_PERIOD_MAX = 48000;
const MIN_COUNCIL_STAKE_MIN = 1000000;
const MIN_COUNCIL_STAKE_MAX = 10000000;
const NEW_TERM_DURATION_MIN = 23000;
const NEW_TERM_DURATION_MAX = 46000;
const CANDIDACY_LIMIT_MIN = 23000;
const CANDIDACY_LIMIT_MAX = 45000;
const COUNCIL_SIZE_MAX = 23;
const COUNCIL_SIZE_MIN = 5;
const MIN_STAKE_MIN = 1;
const MIN_STAKE_MAX = 1000;
const MIN_ACTORS_MIN = 1;
const MIN_ACTORS_MAX = 20;
const MAX_ACTORS_MIN = 1;
const MAX_ACTORS_MAX = 40;
const REWARD_MIN = 100;
const REWARD_MAX = 1000;
const REWARD_PERIOD_MIN = 2000;
const REWARD_PERIOD_MAX = 42000;
const BONDING_PERIOD_MIN = 43000;
const BONDING_PERIOD_MAX = 56000;
const UNBONDING_PERIOD_MIN = 34000;
const UNBONDING_PERIOD_MAX = 36000;
const MIN_SERVICE_PERIOD_MIN = 23000;
const MIN_SERVICE_PERIOD_MAX = 26000;
const STARTUP_GRACE_PERIOD_MIN = 4000;
const STARTUP_GRACE_PERIOD_MAX = 8000;
const ENTRY_REQUEST_FEE_MIN = 400;
const ENTRY_REQUEST_FEE_MAX = 2000;

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
    announcingPeriod: Yup.number()
      .required("All fields must be filled!")
      .min(ANNOUNCING_PERIOD_MIN)
      .max(ANNOUNCING_PERIOD_MAX),
    votingPeriod: Yup.number()
      .required("All fields must be filled!")
      .min(VOTING_PERIOD_MIN)
      .max(VOTING_PERIOD_MAX),
    minVotingStake: Yup.number()
      .required("All fields must be filled!")
      .min(MIN_VOTING_STAKE_MIN)
      .max(MIN_VOTING_STAKE_MAX),
    revealingPeriod: Yup.number()
      .required("All fields must be filled!")
      .min(REVEALING_PERIOD_MIN)
      .max(REVEALING_PERIOD_MAX),
    minCouncilStake: Yup.number()
      .required("All fields must be filled!")
      .min(MIN_COUNCIL_STAKE_MIN)
      .max(MIN_COUNCIL_STAKE_MAX),
    newTermDuration: Yup.number()
      .required("All fields must be filled!")
      .min(NEW_TERM_DURATION_MIN)
      .max(NEW_TERM_DURATION_MAX),
    candidacyLimit: Yup.number()
      .required("All fields must be filled!")
      .min(CANDIDACY_LIMIT_MIN)
      .max(CANDIDACY_LIMIT_MAX),
    councilSize: Yup.number()
      .required("All fields must be filled!")
      .min(COUNCIL_SIZE_MIN)
      .max(COUNCIL_SIZE_MAX)
  },
  Spending: {
    tokens: Yup.number().required("You need to specify an amount of tokens."),
    destinationAccount: Yup.string()
      .required("Select a destination account!")
      .test("address-test", "${account} is not a valid address", account => !!checkAddress(account, 5))
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
    min_stake: Yup.number()
      .required("All parameters are required")
      .min(MIN_STAKE_MIN)
      .max(MIN_STAKE_MAX),
    min_actors: Yup.number()
      .required("All parameters are required")
      .min(MIN_ACTORS_MIN)
      .max(MIN_ACTORS_MAX),
    max_actors: Yup.number()
      .required("All parameters are required")
      .min(MAX_ACTORS_MIN)
      .max(MAX_ACTORS_MAX),
    reward: Yup.number()
      .required("All parameters are required")
      .positive()
      .min(REWARD_MIN)
      .max(REWARD_MAX),
    reward_period: Yup.number()
      .required("All parameters are required")
      .min(REWARD_PERIOD_MIN)
      .max(REWARD_PERIOD_MAX),
    bonding_period: Yup.number()
      .required("All parameters are required")
      .min(BONDING_PERIOD_MIN)
      .max(BONDING_PERIOD_MAX),
    unbonding_period: Yup.number()
      .required("All parameters are required")
      .min(UNBONDING_PERIOD_MIN)
      .max(UNBONDING_PERIOD_MAX),
    min_service_period: Yup.number()
      .required("All parameters are required")
      .min(MIN_SERVICE_PERIOD_MIN)
      .max(MIN_SERVICE_PERIOD_MAX),
    startup_grace_period: Yup.number()
      .required("All parameters are required")
      .min(STARTUP_GRACE_PERIOD_MIN)
      .max(STARTUP_GRACE_PERIOD_MAX),
    entry_request_fee: Yup.number()
      .required("All parameters are required")
      .min(ENTRY_REQUEST_FEE_MIN)
      .max(ENTRY_REQUEST_FEE_MAX)
  }
};

export default Validation;
