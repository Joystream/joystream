import * as Yup from "yup";
import { StringSchema, NumberSchema } from "@types/yup";
import { checkAddress } from "@polkadot/util-crypto";

// Set Election Parameters
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

// Set Validator Count
const MAX_VALIDATOR_COUNT_MIN = 1;
const MAX_VALIDATOR_COUNT_MAX = 25;

// Content Working Group Mint Capacity
const MINT_CAPACITY_MIN = 4000;
const MINT_CAPACITY_MAX = 12000;

// Set Storage Role Parameters
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

function errorMessage(name, min, max) {
  return `${name} should be at least ${min} and no more than ${max}.`;
}

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
  SetContentWorkingGroupMintCapacity: {
    mintCapacity: NumberSchema<number>;
  };
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
      .min(ANNOUNCING_PERIOD_MIN, errorMessage("The announcing period", ANNOUNCING_PERIOD_MIN, ANNOUNCING_PERIOD_MAX))
      .max(ANNOUNCING_PERIOD_MAX, errorMessage("The announcing period", ANNOUNCING_PERIOD_MIN, ANNOUNCING_PERIOD_MAX)),
    votingPeriod: Yup.number()
      .required("All fields must be filled!")
      .min(VOTING_PERIOD_MIN, errorMessage("The voting period", VOTING_PERIOD_MIN, VOTING_PERIOD_MAX))
      .max(VOTING_PERIOD_MAX, errorMessage("The voting period", VOTING_PERIOD_MIN, VOTING_PERIOD_MAX)),
    minVotingStake: Yup.number()
      .required("All fields must be filled!")
      .min(MIN_VOTING_STAKE_MIN, errorMessage("The minimum voting stake", MIN_VOTING_STAKE_MIN, MIN_VOTING_STAKE_MAX))
      .max(MIN_VOTING_STAKE_MAX, errorMessage("The minimum voting stake", MIN_VOTING_STAKE_MIN, MIN_VOTING_STAKE_MAX)),
    revealingPeriod: Yup.number()
      .required("All fields must be filled!")
      .min(REVEALING_PERIOD_MIN, errorMessage("The revealing period", REVEALING_PERIOD_MIN, REVEALING_PERIOD_MAX))
      .max(REVEALING_PERIOD_MAX, errorMessage("The revealing period", REVEALING_PERIOD_MIN, REVEALING_PERIOD_MAX)),
    minCouncilStake: Yup.number()
      .required("All fields must be filled!")
      .min(
        MIN_COUNCIL_STAKE_MIN,
        errorMessage("The minimum council stake", MIN_COUNCIL_STAKE_MIN, MIN_COUNCIL_STAKE_MAX)
      )
      .max(
        MIN_COUNCIL_STAKE_MAX,
        errorMessage("The minimum council stake", MIN_COUNCIL_STAKE_MIN, MIN_COUNCIL_STAKE_MAX)
      ),
    newTermDuration: Yup.number()
      .required("All fields must be filled!")
      .min(NEW_TERM_DURATION_MIN, errorMessage("The new term duration", NEW_TERM_DURATION_MIN, NEW_TERM_DURATION_MAX))
      .max(NEW_TERM_DURATION_MAX, errorMessage("The new term duration", NEW_TERM_DURATION_MIN, NEW_TERM_DURATION_MAX)),
    candidacyLimit: Yup.number()
      .required("All fields must be filled!")
      .min(CANDIDACY_LIMIT_MIN, errorMessage("The candidacy limit", CANDIDACY_LIMIT_MIN, CANDIDACY_LIMIT_MAX))
      .max(CANDIDACY_LIMIT_MAX, errorMessage("The candidacy limit", CANDIDACY_LIMIT_MIN, CANDIDACY_LIMIT_MAX)),
    councilSize: Yup.number()
      .required("All fields must be filled!")
      .min(COUNCIL_SIZE_MIN, errorMessage("The council size", COUNCIL_SIZE_MIN, COUNCIL_SIZE_MAX))
      .max(COUNCIL_SIZE_MAX, errorMessage("The council size", COUNCIL_SIZE_MIN, COUNCIL_SIZE_MAX))
  },
  Spending: {
    tokens: Yup.number()
      .positive("The token amount should be positive.")
      .required("You need to specify an amount of tokens."),
    destinationAccount: Yup.string()
      .required("Select a destination account!")
      .test("address-test", "${account} is not a valid address.", account => !!checkAddress(account, 5))
  },
  SetLead: {
    workingGroupLead: Yup.string().required("Select a proposed lead!")
  },
  SetContentWorkingGroupMintCapacity: {
    mintCapacity: Yup.number()
      .positive("Mint capacity should be positive.")
      .min(MINT_CAPACITY_MIN, errorMessage("Mint capacity", MINT_CAPACITY_MIN, MINT_CAPACITY_MAX))
      .max(MINT_CAPACITY_MAX, errorMessage("Mint capacity", MINT_CAPACITY_MIN, MINT_CAPACITY_MAX))
      .required("You need to specify a mint capacity.")
  },
  EvictStorageProvider: {
    storageProvider: Yup.string()
      .nullable()
      .required("Select a storage provider!")
  },
  SetValidatorCount: {
    maxValidatorCount: Yup.number()
      .required("Enter the max validator count")
      .min(
        MAX_VALIDATOR_COUNT_MIN,
        errorMessage("The max validator count", MAX_VALIDATOR_COUNT_MIN, MAX_VALIDATOR_COUNT_MAX)
      )
      .max(
        MAX_VALIDATOR_COUNT_MAX,
        errorMessage("The max validator count", MAX_VALIDATOR_COUNT_MIN, MAX_VALIDATOR_COUNT_MAX)
      )
  },
  SetStorageRoleParameters: {
    min_stake: Yup.number()
      .required("All parameters are required")
      .min(MIN_STAKE_MIN, errorMessage("Minimum stake", MIN_STAKE_MIN, MIN_STAKE_MAX))
      .max(MIN_STAKE_MAX, errorMessage("Minimum stake", MIN_STAKE_MIN, MIN_STAKE_MAX)),
    min_actors: Yup.number()
      .required("All parameters are required")
      .min(MIN_ACTORS_MIN, errorMessage("Minimum actors", MIN_ACTORS_MIN, MIN_ACTORS_MAX))
      .max(MIN_ACTORS_MAX, errorMessage("Minimum actors", MIN_ACTORS_MIN, MIN_ACTORS_MAX)),
    max_actors: Yup.number()
      .required("All parameters are required")
      .min(MAX_ACTORS_MIN, errorMessage("Max actors", MAX_ACTORS_MIN, MAX_ACTORS_MAX))
      .max(MAX_ACTORS_MAX, errorMessage("Max actors", MAX_ACTORS_MIN, MAX_ACTORS_MAX)),
    reward: Yup.number()
      .required("All parameters are required")
      .positive()
      .min(REWARD_MIN, errorMessage("Reward", REWARD_MIN, REWARD_MAX))
      .max(REWARD_MAX, errorMessage("Reward", REWARD_MIN, REWARD_MAX)),
    reward_period: Yup.number()
      .required("All parameters are required")
      .min(REWARD_PERIOD_MIN, errorMessage("The reward period", REWARD_PERIOD_MIN, REWARD_PERIOD_MAX))
      .max(REWARD_PERIOD_MAX, errorMessage("The reward period", REWARD_PERIOD_MIN, REWARD_PERIOD_MAX)),
    bonding_period: Yup.number()
      .required("All parameters are required")
      .min(BONDING_PERIOD_MIN, errorMessage("The bonding period", BONDING_PERIOD_MIN, BONDING_PERIOD_MAX))
      .max(BONDING_PERIOD_MAX, errorMessage("The bonding period", BONDING_PERIOD_MIN, BONDING_PERIOD_MAX)),
    unbonding_period: Yup.number()
      .required("All parameters are required")
      .min(UNBONDING_PERIOD_MIN, errorMessage("The unbonding period", UNBONDING_PERIOD_MIN, UNBONDING_PERIOD_MAX))
      .max(UNBONDING_PERIOD_MAX, errorMessage("The unbonding period", UNBONDING_PERIOD_MIN, UNBONDING_PERIOD_MAX)),
    min_service_period: Yup.number()
      .required("All parameters are required")
      .min(
        MIN_SERVICE_PERIOD_MIN,
        errorMessage("The minimum service period", MIN_SERVICE_PERIOD_MIN, MIN_SERVICE_PERIOD_MAX)
      )
      .max(
        MIN_SERVICE_PERIOD_MAX,
        errorMessage("The minimum service period", MIN_SERVICE_PERIOD_MIN, MIN_SERVICE_PERIOD_MAX)
      ),
    startup_grace_period: Yup.number()
      .required("All parameters are required")
      .min(
        STARTUP_GRACE_PERIOD_MIN,
        errorMessage("The startup grace period", STARTUP_GRACE_PERIOD_MIN, STARTUP_GRACE_PERIOD_MAX)
      )
      .max(
        STARTUP_GRACE_PERIOD_MAX,
        errorMessage("The startup grace period", STARTUP_GRACE_PERIOD_MIN, STARTUP_GRACE_PERIOD_MAX)
      ),
    entry_request_fee: Yup.number()
      .required("All parameters are required")
      .min(ENTRY_REQUEST_FEE_MIN, errorMessage("The entry request fee", ENTRY_REQUEST_FEE_MIN, ENTRY_REQUEST_FEE_MAX))
      .max(ENTRY_REQUEST_FEE_MAX, errorMessage("The entry request fee", ENTRY_REQUEST_FEE_MIN, ENTRY_REQUEST_FEE_MAX))
  }
};

export default Validation;
