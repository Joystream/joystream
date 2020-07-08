import * as Yup from 'yup';
import { schemaValidator, ActivateOpeningAtKeys } from '@joystream/types/hiring';

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

// Add Working Group Leader Opening Parameters
// TODO: Discuss the actual values
const MIN_EXACT_BLOCK_MINUS_CURRENT = 14400 * 5; // ~5 days
const MAX_EXACT_BLOCK_MINUS_CURRENT = 14400 * 60; // 2 months
const MAX_REVIEW_PERIOD_LENGTH_MIN = 14400 * 5; // ~5 days
const MAX_REVIEW_PERIOD_LENGTH_MAX = 14400 * 60; // 2 months
const MAX_APPLICATIONS_MIN = 1;
const MAX_APPLICATIONS_MAX = 1000;
const APPLICATION_STAKE_VALUE_MIN = 1;
const APPLICATION_STAKE_VALUE_MAX = 1000000;
const ROLE_STAKE_VALUE_MIN = 1;
const ROLE_STAKE_VALUE_MAX = 1000000;
const TERMINATE_ROLE_UNSTAKING_MIN = 0;
const TERMINATE_ROLE_UNSTAKING_MAX = 14 * 14400; // 14 days
const LEAVE_ROLE_UNSTAKING_MIN = 0;
const LEAVE_ROLE_UNSTAKING_MAX = 14 * 14400; // 14 days

function errorMessage (name: string, min?: number | string, max?: number | string, unit?: string): string {
  return `${name} should be at least ${min} and no more than ${max}${unit ? ` ${unit}.` : '.'}`;
}

/*
Validation is used to validate a proposal form.
Each proposal type should validate the fields of his form, anything is valid as long as it fits in a Yup Schema.
In a form, validation should be injected in the Yup Schema just by accessing it in this object.
Ex:
// Text Form

import Validation from 'path/to/validationSchema'
...
  validationSchema: Yup.object().shape({
    ...genericFormDefaultOptions.validationSchema,
    description: Validation.Text.description
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
    WASM: Yup.MixedSchema<any>;
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
  SetValidatorCount: {
    maxValidatorCount: Yup.NumberSchema<number>;
  };
  AddWorkingGroupLeaderOpening: (currentBlock: number) => {
    applicationsLimited: Yup.BooleanSchema<boolean>;
    activateAt: Yup.StringSchema<string>;
    activateAtBlock: Yup.NumberSchema<number>;
    maxReviewPeriodLength: Yup.NumberSchema<number>;
    maxApplications: Yup.NumberSchema<number>;
    applicationStakeRequired: Yup.BooleanSchema<boolean>;
    applicationStakeValue: Yup.NumberSchema<number>;
    roleStakeRequired: Yup.BooleanSchema<boolean>;
    roleStakeValue: Yup.NumberSchema<number>;
    terminateRoleUnstakingPeriod: Yup.NumberSchema<number>;
    leaveRoleUnstakingPeriod: Yup.NumberSchema<number>;
    humanReadableText: Yup.StringSchema<string>;
  };
};

// Helpers for common validation
function minMaxInt (min: number, max: number, fieldName: string) {
  return Yup.number()
    .required(`${fieldName} is required!`)
    .integer(`${fieldName} must be an integer!`)
    .min(min, errorMessage(fieldName, min, max))
    .max(max, errorMessage(fieldName, min, max));
}

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
    WASM: Yup.mixed()
      .test('fileArrayBuffer', 'Unexpected data format, file cannot be processed.', value => typeof value.byteLength !== 'undefined')
      .test('fileSizeMin', `Minimum file size is ${FILE_SIZE_BYTES_MIN} bytes.`, value => value.byteLength >= FILE_SIZE_BYTES_MIN)
      .test('fileSizeMax', `Maximum file size is ${FILE_SIZE_BYTES_MAX} bytes.`, value => value.byteLength <= FILE_SIZE_BYTES_MAX)
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
  AddWorkingGroupLeaderOpening: (currentBlock: number) => ({
    activateAt: Yup.string().required(),
    activateAtBlock: Yup.number()
      .when('activateAt', {
        is: ActivateOpeningAtKeys.ExactBlock,
        then: minMaxInt(
          MIN_EXACT_BLOCK_MINUS_CURRENT + currentBlock,
          MAX_EXACT_BLOCK_MINUS_CURRENT + currentBlock,
          'Exact block'
        )
      }),
    maxReviewPeriodLength: minMaxInt(MAX_REVIEW_PERIOD_LENGTH_MIN, MAX_REVIEW_PERIOD_LENGTH_MAX, 'Max. review period length'),
    applicationsLimited: Yup.boolean(),
    maxApplications: Yup.number()
      .when('applicationsLimited', {
        is: true,
        then: minMaxInt(MAX_APPLICATIONS_MIN, MAX_APPLICATIONS_MAX, 'Max. number of applications')
      }),
    applicationStakeRequired: Yup.boolean(),
    applicationStakeValue: Yup.number()
      .when('applicationStakeRequired', {
        is: true,
        then: minMaxInt(APPLICATION_STAKE_VALUE_MIN, APPLICATION_STAKE_VALUE_MAX, 'Application stake value')
      }),
    roleStakeRequired: Yup.boolean(),
    roleStakeValue: Yup.number()
      .when('roleStakeRequired', {
        is: true,
        then: minMaxInt(ROLE_STAKE_VALUE_MIN, ROLE_STAKE_VALUE_MAX, 'Role stake value')
      }),
    terminateRoleUnstakingPeriod: minMaxInt(
      TERMINATE_ROLE_UNSTAKING_MIN,
      TERMINATE_ROLE_UNSTAKING_MAX,
      'Terminate role unstaking period'
    ),
    leaveRoleUnstakingPeriod: minMaxInt(
      LEAVE_ROLE_UNSTAKING_MIN,
      LEAVE_ROLE_UNSTAKING_MAX,
      'Leave role unstaking period'
    ),
    humanReadableText: Yup.string()
      .required()
      .test(
        'schemaIsValid',
        'Schema validation failed!',
        function (val) {
          let schemaObj: any;
          try {
            schemaObj = JSON.parse(val);
          } catch (e) {
            return this.createError({ message: 'Schema validation failed: Invalid JSON' });
          }
          const isValid = schemaValidator(schemaObj);
          const errors = schemaValidator.errors || [];
          if (!isValid) {
            return this.createError({
              message: 'Schema validation failed: ' + errors.map(e => `${e.message}${e.dataPath && ` (${e.dataPath})`}`).join(', ')
            });
          }
          return true;
        }
      )
  })
};

export default Validation;
