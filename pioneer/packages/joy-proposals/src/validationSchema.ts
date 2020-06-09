import * as Yup from 'yup';
import { checkAddress } from '@polkadot/util-crypto';

// TODO: If we really need this (currency unit) we can we make "Validation" a functiction that returns an object.
// We could then "instantialize" it in "withFormContainer" where instead of passing
// "validationSchema" (in each form component file) we would just pass "validationSchemaKey" or just "proposalType" (ie. SetLead).
// Then we could let the "withFormContainer" handle the actual "validationSchema" for "withFormik". In that case it could easily
// pass stuff like totalIssuance or currencyUnit here (ie.: const validationSchema = Validation(currencyUnit, totalIssuance)[proposalType];)
const CURRENCY_UNIT = undefined;

// All
const TITLE_MAX_LENGTH = 40;
const RATIONALE_MAX_LENGTH = 3000;

// Text
const DESCRIPTION_MAX_LENGTH = 5000;

// Runtime Upgrade
const FILE_SIZE_BYTES_MIN = 1;
const FILE_SIZE_BYTES_MAX = 2000000;

// Set Election Parameters
const ANNOUNCING_PERIOD_MAX = 43200;
const ANNOUNCING_PERIOD_MIN = 14400;
const VOTING_PERIOD_MIN = 14400;
const VOTING_PERIOD_MAX = 28800;
const REVEALING_PERIOD_MIN = 14400;
const REVEALING_PERIOD_MAX = 28800;
const MIN_COUNCIL_STAKE_MIN = 1;
const MIN_COUNCIL_STAKE_MAX = 100000;
const NEW_TERM_DURATION_MIN = 14400;
const NEW_TERM_DURATION_MAX = 432000;
const CANDIDACY_LIMIT_MIN = 25;
const CANDIDACY_LIMIT_MAX = 100;
const COUNCIL_SIZE_MAX = 20;
const COUNCIL_SIZE_MIN = 4;
const MIN_VOTING_STAKE_MIN = 1;
const MIN_VOTING_STAKE_MAX = 100000;

// Spending
const TOKENS_MIN = 0;
const TOKENS_MAX = 2000000;

// Set Validator Count
const MAX_VALIDATOR_COUNT_MIN = 4;
const MAX_VALIDATOR_COUNT_MAX = 100;

// Content Working Group Mint Capacity
const MINT_CAPACITY_MIN = 0;
const MINT_CAPACITY_MAX = 1000000;

// Set Storage Role Parameters
const MIN_STAKE_MIN = 1;
const MIN_STAKE_MAX = 10000000;
const MIN_ACTORS_MIN = 0;
const MIN_ACTORS_MAX = 1;
const MAX_ACTORS_MIN = 2;
const MAX_ACTORS_MAX = 99;
const REWARD_MIN = 1;
const REWARD_MAX = 99999;
const REWARD_PERIOD_MIN = 600;
const REWARD_PERIOD_MAX = 3600;
const BONDING_PERIOD_MIN = 600;
const BONDING_PERIOD_MAX = 28800;
const UNBONDING_PERIOD_MIN = 600;
const UNBONDING_PERIOD_MAX = 28800;
const MIN_SERVICE_PERIOD_MIN = 600;
const MIN_SERVICE_PERIOD_MAX = 28800;
const STARTUP_GRACE_PERIOD_MIN = 600;
const STARTUP_GRACE_PERIOD_MAX = 28800;
const ENTRY_REQUEST_FEE_MIN = 1;
const ENTRY_REQUEST_FEE_MAX = 100000;

function errorMessage (name: string, min?: number | string, max?: number | string, unit?: string): string {
  return `${name} should be at least ${min} and no more than ${max}${unit ? ` ${unit}.` : '.'}`;
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
    title: Yup.StringSchema<string>;
    rationale: Yup.StringSchema<string>;
  };
  Text: {
    description: Yup.StringSchema<string>;
  };
  RuntimeUpgrade: {
    WASM: Yup.StringSchema<string>;
  };
  SetElectionParameters: {
    announcingPeriod: Yup.NumberSchema<number>;
    votingPeriod: Yup.NumberSchema<number>;
    minVotingStake: Yup.NumberSchema<number>;
    revealingPeriod: Yup.NumberSchema<number>;
    minCouncilStake: Yup.NumberSchema<number>;
    newTermDuration: Yup.NumberSchema<number>;
    candidacyLimit: Yup.NumberSchema<number>;
    councilSize: Yup.NumberSchema<number>;
  };
  Spending: {
    tokens: Yup.NumberSchema<number>;
    destinationAccount: Yup.StringSchema<string>;
  };
  SetLead: {
    workingGroupLead: Yup.StringSchema<string>;
  };
  SetContentWorkingGroupMintCapacity: {
    mintCapacity: Yup.NumberSchema<number>;
  };
  EvictStorageProvider: {
    storageProvider: Yup.StringSchema<string | null>;
  };
  SetValidatorCount: {
    maxValidatorCount: Yup.NumberSchema<number>;
  };
  SetStorageRoleParameters: {
    min_stake: Yup.NumberSchema<number>;
    min_actors: Yup.NumberSchema<number>;
    max_actors: Yup.NumberSchema<number>;
    reward: Yup.NumberSchema<number>;
    reward_period: Yup.NumberSchema<number>;
    bonding_period: Yup.NumberSchema<number>;
    unbonding_period: Yup.NumberSchema<number>;
    min_service_period: Yup.NumberSchema<number>;
    startup_grace_period: Yup.NumberSchema<number>;
    entry_request_fee: Yup.NumberSchema<number>;
  };
};

const Validation: ValidationType = {
  All: {
    title: Yup.string()
      .required('Title is required!')
      .max(TITLE_MAX_LENGTH, `Title should be under ${TITLE_MAX_LENGTH} characters.`),
    rationale: Yup.string()
      .required('Rationale is required!')
      .max(RATIONALE_MAX_LENGTH, `Rationale should be under ${RATIONALE_MAX_LENGTH} characters.`)
  },
  Text: {
    description: Yup.string()
      .required('Description is required!')
      .max(DESCRIPTION_MAX_LENGTH, `Description should be under ${DESCRIPTION_MAX_LENGTH}`)
  },
  RuntimeUpgrade: {
    WASM: Yup.string()
      .required('A file is required')
      .min(FILE_SIZE_BYTES_MIN, 'File is empty.')
      .max(FILE_SIZE_BYTES_MAX, `The maximum file size is ${FILE_SIZE_BYTES_MAX} bytes.`)
  },
  SetElectionParameters: {
    announcingPeriod: Yup.number()
      .required('All fields must be filled!')
      .integer('This field must be an integer.')
      .min(
        ANNOUNCING_PERIOD_MIN,
        errorMessage('The announcing period', ANNOUNCING_PERIOD_MIN, ANNOUNCING_PERIOD_MAX, 'blocks')
      )
      .max(
        ANNOUNCING_PERIOD_MAX,
        errorMessage('The announcing period', ANNOUNCING_PERIOD_MIN, ANNOUNCING_PERIOD_MAX, 'blocks')
      ),
    votingPeriod: Yup.number()
      .required('All fields must be filled!')
      .integer('This field must be an integer.')
      .min(VOTING_PERIOD_MIN, errorMessage('The voting period', VOTING_PERIOD_MIN, VOTING_PERIOD_MAX, 'blocks'))
      .max(VOTING_PERIOD_MAX, errorMessage('The voting period', VOTING_PERIOD_MIN, VOTING_PERIOD_MAX, 'blocks')),
    minVotingStake: Yup.number()
      .required('All fields must be filled!')
      .integer('This field must be an integer.')
      .min(
        MIN_VOTING_STAKE_MIN,
        errorMessage('The minimum voting stake', MIN_VOTING_STAKE_MIN, MIN_VOTING_STAKE_MAX, CURRENCY_UNIT)
      )
      .max(
        MIN_VOTING_STAKE_MAX,
        errorMessage('The minimum voting stake', MIN_VOTING_STAKE_MIN, MIN_VOTING_STAKE_MAX, CURRENCY_UNIT)
      ),
    revealingPeriod: Yup.number()
      .required('All fields must be filled!')
      .integer('This field must be an integer.')
      .min(
        REVEALING_PERIOD_MIN,
        errorMessage('The revealing period', REVEALING_PERIOD_MIN, REVEALING_PERIOD_MAX, 'blocks')
      )
      .max(
        REVEALING_PERIOD_MAX,
        errorMessage('The revealing period', REVEALING_PERIOD_MIN, REVEALING_PERIOD_MAX, 'blocks')
      ),
    minCouncilStake: Yup.number()
      .required('All fields must be filled!')
      .integer('This field must be an integer.')
      .min(
        MIN_COUNCIL_STAKE_MIN,
        errorMessage('The minimum council stake', MIN_COUNCIL_STAKE_MIN, MIN_COUNCIL_STAKE_MAX, CURRENCY_UNIT)
      )
      .max(
        MIN_COUNCIL_STAKE_MAX,
        errorMessage('The minimum council stake', MIN_COUNCIL_STAKE_MIN, MIN_COUNCIL_STAKE_MAX, CURRENCY_UNIT)
      ),
    newTermDuration: Yup.number()
      .required('All fields must be filled!')
      .integer('This field must be an integer.')
      .min(
        NEW_TERM_DURATION_MIN,
        errorMessage('The new term duration', NEW_TERM_DURATION_MIN, NEW_TERM_DURATION_MAX, 'blocks')
      )
      .max(
        NEW_TERM_DURATION_MAX,
        errorMessage('The new term duration', NEW_TERM_DURATION_MIN, NEW_TERM_DURATION_MAX, 'blocks')
      ),
    candidacyLimit: Yup.number()
      .required('All fields must be filled!')
      .integer('This field must be an integer.')
      .min(CANDIDACY_LIMIT_MIN, errorMessage('The candidacy limit', CANDIDACY_LIMIT_MIN, CANDIDACY_LIMIT_MAX))
      .max(CANDIDACY_LIMIT_MAX, errorMessage('The candidacy limit', CANDIDACY_LIMIT_MIN, CANDIDACY_LIMIT_MAX)),
    councilSize: Yup.number()
      .required('All fields must be filled!')
      .integer('This field must be an integer.')
      .min(COUNCIL_SIZE_MIN, errorMessage('The council size', COUNCIL_SIZE_MIN, COUNCIL_SIZE_MAX))
      .max(COUNCIL_SIZE_MAX, errorMessage('The council size', COUNCIL_SIZE_MIN, COUNCIL_SIZE_MAX))
  },
  Spending: {
    tokens: Yup.number()
      .positive('The token amount should be positive.')
      .integer('This field must be an integer.')
      .max(TOKENS_MAX, errorMessage('The amount of tokens', TOKENS_MIN, TOKENS_MAX))
      .required('You need to specify an amount of tokens.'),
    destinationAccount: Yup.string()
      .required('Select a destination account!')
      .test('address-test', 'Invalid account address.', account => checkAddress(account, 5)[0])
  },
  SetLead: {
    workingGroupLead: Yup.string().required('Select a proposed lead!')
  },
  SetContentWorkingGroupMintCapacity: {
    mintCapacity: Yup.number()
      .positive('Mint capacity should be positive.')
      .integer('This field must be an integer.')
      .min(MINT_CAPACITY_MIN, errorMessage('Mint capacity', MINT_CAPACITY_MIN, MINT_CAPACITY_MAX, CURRENCY_UNIT))
      .max(MINT_CAPACITY_MAX, errorMessage('Mint capacity', MINT_CAPACITY_MIN, MINT_CAPACITY_MAX, CURRENCY_UNIT))
      .required('You need to specify a mint capacity.')
  },
  EvictStorageProvider: {
    storageProvider: Yup.string()
      .nullable()
      .required('Select a storage provider!')
  },
  SetValidatorCount: {
    maxValidatorCount: Yup.number()
      .required('Enter the max validator count')
      .integer('This field must be an integer.')
      .min(
        MAX_VALIDATOR_COUNT_MIN,
        errorMessage('The max validator count', MAX_VALIDATOR_COUNT_MIN, MAX_VALIDATOR_COUNT_MAX)
      )
      .max(
        MAX_VALIDATOR_COUNT_MAX,
        errorMessage('The max validator count', MAX_VALIDATOR_COUNT_MIN, MAX_VALIDATOR_COUNT_MAX)
      )
  },
  SetStorageRoleParameters: {
    min_stake: Yup.number()
      .required('All parameters are required')
      .positive('The minimum stake should be positive.')
      .integer('This field must be an integer.')
      .max(MIN_STAKE_MAX, errorMessage('Minimum stake', MIN_STAKE_MIN, MIN_STAKE_MAX, CURRENCY_UNIT)),
    min_actors: Yup.number()
      .required('All parameters are required')
      .integer('This field must be an integer.')
      .min(MIN_ACTORS_MIN, errorMessage('Minimum actors', MIN_ACTORS_MIN, MIN_ACTORS_MAX))
      .max(MIN_ACTORS_MAX, errorMessage('Minimum actors', MIN_ACTORS_MIN, MIN_ACTORS_MAX)),
    max_actors: Yup.number()
      .required('All parameters are required')
      .integer('This field must be an integer.')
      .min(MAX_ACTORS_MIN, errorMessage('Max actors', MAX_ACTORS_MIN, MAX_ACTORS_MAX))
      .max(MAX_ACTORS_MAX, errorMessage('Max actors', MAX_ACTORS_MIN, MAX_ACTORS_MAX)),
    reward: Yup.number()
      .required('All parameters are required')
      .integer('This field must be an integer.')
      .min(REWARD_MIN, errorMessage('Reward', REWARD_MIN, REWARD_MAX, CURRENCY_UNIT))
      .max(REWARD_MAX, errorMessage('Reward', REWARD_MIN, REWARD_MAX, CURRENCY_UNIT)),
    reward_period: Yup.number()
      .required('All parameters are required')
      .integer('This field must be an integer.')
      .min(REWARD_PERIOD_MIN, errorMessage('The reward period', REWARD_PERIOD_MIN, REWARD_PERIOD_MAX, 'blocks'))
      .max(REWARD_PERIOD_MAX, errorMessage('The reward period', REWARD_PERIOD_MIN, REWARD_PERIOD_MAX, 'blocks')),
    bonding_period: Yup.number()
      .required('All parameters are required')
      .integer('This field must be an integer.')
      .min(BONDING_PERIOD_MIN, errorMessage('The bonding period', BONDING_PERIOD_MIN, BONDING_PERIOD_MAX, 'blocks'))
      .max(BONDING_PERIOD_MAX, errorMessage('The bonding period', BONDING_PERIOD_MIN, BONDING_PERIOD_MAX, 'blocks')),
    unbonding_period: Yup.number()
      .required('All parameters are required')
      .integer('This field must be an integer.')
      .min(
        UNBONDING_PERIOD_MIN,
        errorMessage('The unbonding period', UNBONDING_PERIOD_MIN, UNBONDING_PERIOD_MAX, 'blocks')
      )
      .max(
        UNBONDING_PERIOD_MAX,
        errorMessage('The unbonding period', UNBONDING_PERIOD_MIN, UNBONDING_PERIOD_MAX, 'blocks')
      ),
    min_service_period: Yup.number()
      .required('All parameters are required')
      .integer('This field must be an integer.')
      .min(
        MIN_SERVICE_PERIOD_MIN,
        errorMessage('The minimum service period', MIN_SERVICE_PERIOD_MIN, MIN_SERVICE_PERIOD_MAX, 'blocks')
      )
      .max(
        MIN_SERVICE_PERIOD_MAX,
        errorMessage('The minimum service period', MIN_SERVICE_PERIOD_MIN, MIN_SERVICE_PERIOD_MAX, 'blocks')
      ),
    startup_grace_period: Yup.number()
      .required('All parameters are required')
      .integer('This field must be an integer.')
      .min(
        STARTUP_GRACE_PERIOD_MIN,
        errorMessage('The startup grace period', STARTUP_GRACE_PERIOD_MIN, STARTUP_GRACE_PERIOD_MAX, 'blocks')
      )
      .max(
        STARTUP_GRACE_PERIOD_MAX,
        errorMessage('The startup grace period', STARTUP_GRACE_PERIOD_MIN, STARTUP_GRACE_PERIOD_MAX, 'blocks')
      ),
    entry_request_fee: Yup.number()
      .required('All parameters are required')
      .integer('This field must be an integer.')
      .min(
        ENTRY_REQUEST_FEE_MIN,
        errorMessage('The entry request fee', ENTRY_REQUEST_FEE_MIN, ENTRY_REQUEST_FEE_MAX, CURRENCY_UNIT)
      )
      .max(
        STARTUP_GRACE_PERIOD_MAX,
        errorMessage('The entry request fee', ENTRY_REQUEST_FEE_MIN, ENTRY_REQUEST_FEE_MAX, CURRENCY_UNIT)
      )
  }
};

export default Validation;
