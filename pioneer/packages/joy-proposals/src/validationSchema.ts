import * as Yup from 'yup';
import { schemaValidator, ActivateOpeningAtKeys } from '@joystream/types/hiring';
import { ProposalTypes } from '@polkadot/joy-utils/types/proposals';
import { GenericFormValues } from './forms/GenericProposalForm';
import { InputValidationLengthConstraint } from '@joystream/types/common';
import { FormValues as SignalFormValues } from './forms/SignalForm';
import { FormValues as RuntimeUpgradeFormValues } from './forms/RuntimeUpgradeForm';
import { FormValues as SetCouncilParamsFormValues } from './forms/SetCouncilParamsForm';
import { FormValues as SpendingProposalFormValues } from './forms/SpendingProposalForm';
import { FormValues as SetContentWorkingGroupLeadFormValues } from './forms/SetContentWorkingGroupLeadForm';
import { FormValues as SetContentWorkingGroupMintCapacityFormValues } from './forms/MintCapacityForm';
import { FormValues as SetMaxValidatorCountFormValues } from './forms/SetMaxValidatorCountForm';
import { FormValues as AddWorkingGroupLeaderOpeningFormValues } from './forms/AddWorkingGroupOpeningForm';
import { FormValues as SetWorkingGroupMintCapacityFormValues } from './forms/SetWorkingGroupMintCapacityForm';
import { FormValues as BeginReviewLeaderApplicationsFormValues } from './forms/BeginReviewLeaderApplicationsForm';
import { FormValues as FillWorkingGroupLeaderOpeningFormValues } from './forms/FillWorkingGroupLeaderOpeningForm';
import { FormValues as DecreaseWorkingGroupLeadStakeFormValues } from './forms/DecreaseWorkingGroupLeadStakeForm';
import { FormValues as SlashWorkingGroupLeadStakeFormValues } from './forms/SlashWorkingGroupLeadStakeForm';
import { FormValues as SetWorkingGroupLeadRewardFormValues } from './forms/SetWorkingGroupLeadRewardForm';
import { FormValues as TerminateWorkingGroupLeaderFormValues } from './forms/TerminateWorkingGroupLeaderForm';

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

// Set Working Group Mint Capacity
// TODO: Discuss the actual values
const WG_MINT_CAP_MIN = 0;
const WG_MINT_CAP_MAX = 1000000;

// Fill Working Group Leader Opening / Set Working Group Lead Reward
// TODO: Discuss the actual values
const MIN_REWARD_AMOUNT = 1;
const MAX_REWARD_AMOUNT = 100000;
const MIN_REWARD_INTERVAL = 1;
const MAX_REWARD_INTERVAL = 30 * 14400; // 30 days
// 3 days margin (voting_period) to prevent FillOpeningInvalidNextPaymentBlock
// Should we worry that much about it though?
const MIN_NEXT_PAYMENT_BLOCK_MINUS_CURRENT = 3 * 14400;
const MAX_NEXT_PAYMENT_BLOCK_MINUS_CURRENT = 30 * 14400; // 30 days

// Decrease/Slash Working Group Leader Stake
const DECREASE_LEAD_STAKE_MIN = 1;
const SLASH_LEAD_STAKE_MIN = 1;
// Max is validated in form component, because it depends on selected working group's leader stake

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
    ...Validation.Text()
  }),

*/

type ProposalTypeKeys = typeof ProposalTypes[number];
type OutdatedProposals = 'EvictStorageProvider' | 'SetStorageRoleParameters';
type ValidationTypeKeys = Exclude<ProposalTypeKeys, OutdatedProposals> | 'All';

/* eslint-disable @typescript-eslint/indent */
// /\ This prevents eslint from trying to make "stairs" out of those multiple conditions.
// They are more readable when one is directly under the other (switch-case style)
type FormValuesByType<T extends ValidationTypeKeys> =
  T extends 'All' ? GenericFormValues :
  T extends 'Text' ? Omit<SignalFormValues, keyof GenericFormValues> :
  T extends 'RuntimeUpgrade' ? Omit<RuntimeUpgradeFormValues, keyof GenericFormValues> :
  T extends 'SetElectionParameters' ? Omit<SetCouncilParamsFormValues, keyof GenericFormValues> :
  T extends 'Spending' ? Omit<SpendingProposalFormValues, keyof GenericFormValues> :
  T extends 'SetLead' ? Omit<SetContentWorkingGroupLeadFormValues, keyof GenericFormValues> :
  T extends 'SetContentWorkingGroupMintCapacity' ? Omit<SetContentWorkingGroupMintCapacityFormValues, keyof GenericFormValues> :
  T extends 'SetValidatorCount' ? Omit<SetMaxValidatorCountFormValues, keyof GenericFormValues> :
  T extends 'AddWorkingGroupLeaderOpening' ? Omit<AddWorkingGroupLeaderOpeningFormValues, keyof GenericFormValues> :
  T extends 'SetWorkingGroupMintCapacity' ? Omit<SetWorkingGroupMintCapacityFormValues, keyof GenericFormValues> :
  T extends 'BeginReviewWorkingGroupLeaderApplication' ? Omit<BeginReviewLeaderApplicationsFormValues, keyof GenericFormValues> :
  T extends 'FillWorkingGroupLeaderOpening' ? Omit<FillWorkingGroupLeaderOpeningFormValues, keyof GenericFormValues> :
  T extends 'DecreaseWorkingGroupLeaderStake' ? Omit<DecreaseWorkingGroupLeadStakeFormValues, keyof GenericFormValues> :
  T extends 'SlashWorkingGroupLeaderStake' ? Omit<SlashWorkingGroupLeadStakeFormValues, keyof GenericFormValues> :
  T extends 'SetWorkingGroupLeaderReward' ? Omit<SetWorkingGroupLeadRewardFormValues, keyof GenericFormValues> :
  T extends 'TerminateWorkingGroupLeaderRole' ? Omit<TerminateWorkingGroupLeaderFormValues, keyof GenericFormValues> :
  never;

type ValidationSchemaFuncParamsByType<T extends ValidationTypeKeys> =
  T extends 'AddWorkingGroupLeaderOpening' ? [number, InputValidationLengthConstraint] :
  T extends 'FillWorkingGroupLeaderOpening' ? [number] :
  T extends 'TerminateWorkingGroupLeaderRole' ? [InputValidationLengthConstraint] :
  [];

/* eslint-enable @typescript-eslint/indent */

type ValidationSchemaFunc<FieldValuesT extends {}, ParamsT extends any[] = []> = (...params: ParamsT) =>
({ [fieldK in keyof FieldValuesT]: Yup.Schema<any> });

type ValidationType = {
  [validationTypeK in ValidationTypeKeys]: ValidationSchemaFunc<
  FormValuesByType<validationTypeK>,
  ValidationSchemaFuncParamsByType<validationTypeK>
  >
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
  All: () => ({
    title: Yup.string()
      .required('Title is required!')
      .max(TITLE_MAX_LENGTH, `Title should be under ${TITLE_MAX_LENGTH} characters.`),
    rationale: Yup.string()
      .required('Rationale is required!')
      .max(RATIONALE_MAX_LENGTH, `Rationale should be under ${RATIONALE_MAX_LENGTH} characters.`)
  }),
  Text: () => ({
    description: Yup.string()
      .required('Description is required!')
      .max(DESCRIPTION_MAX_LENGTH, `Description should be under ${DESCRIPTION_MAX_LENGTH}`)
  }),
  RuntimeUpgrade: () => ({
    WASM: Yup.mixed()
      .test('fileArrayBuffer', 'Unexpected data format, file cannot be processed.', value => typeof value.byteLength !== 'undefined')
      .test('fileSizeMin', `Minimum file size is ${FILE_SIZE_BYTES_MIN} bytes.`, value => value.byteLength >= FILE_SIZE_BYTES_MIN)
      .test('fileSizeMax', `Maximum file size is ${FILE_SIZE_BYTES_MAX} bytes.`, value => value.byteLength <= FILE_SIZE_BYTES_MAX)
  }),
  SetElectionParameters: () => ({
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
  }),
  Spending: () => ({
    tokens: Yup.number()
      .positive('The token amount should be positive.')
      .integer('This field must be an integer.')
      .max(TOKENS_MAX, errorMessage('The amount of tokens', TOKENS_MIN, TOKENS_MAX))
      .required('You need to specify an amount of tokens.'),
    destinationAccount: Yup.string()
      .required('Select a destination account!')
  }),
  SetLead: () => ({
    workingGroupLead: Yup.string().required('Select a proposed lead!')
  }),
  SetContentWorkingGroupMintCapacity: () => ({
    capacity: Yup.number()
      .positive('Mint capacity should be positive.')
      .integer('This field must be an integer.')
      .min(MINT_CAPACITY_MIN, errorMessage('Mint capacity', MINT_CAPACITY_MIN, MINT_CAPACITY_MAX, CURRENCY_UNIT))
      .max(MINT_CAPACITY_MAX, errorMessage('Mint capacity', MINT_CAPACITY_MIN, MINT_CAPACITY_MAX, CURRENCY_UNIT))
      .required('You need to specify a mint capacity.')
  }),
  SetValidatorCount: () => ({
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
  }),
  AddWorkingGroupLeaderOpening: (currentBlock: number, { min: HRTMin, max: HRTMax }: InputValidationLengthConstraint) => ({
    workingGroup: Yup.string(),
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
    applicationStakeMode: Yup.string(),
    applicationStakeValue: Yup.number()
      .when('applicationStakeRequired', {
        is: true,
        then: minMaxInt(APPLICATION_STAKE_VALUE_MIN, APPLICATION_STAKE_VALUE_MAX, 'Application stake value')
      }),
    roleStakeRequired: Yup.boolean(),
    roleStakeMode: Yup.string(),
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
      .min(HRTMin.toNumber(), `human_readable_text must be at least ${HRTMin.toNumber()} character(s) long`)
      .max(HRTMax.toNumber(), `human_readable_text cannot be more than ${HRTMax.toNumber()} character(s) long`)
  }),
  SetWorkingGroupMintCapacity: () => ({
    workingGroup: Yup.string(),
    capacity: minMaxInt(WG_MINT_CAP_MIN, WG_MINT_CAP_MAX, 'Mint capacity')
  }),
  BeginReviewWorkingGroupLeaderApplication: () => ({
    workingGroup: Yup.string(),
    openingId: Yup.number().required('Select an opening!')
  }),
  FillWorkingGroupLeaderOpening: (currentBlock: number) => ({
    workingGroup: Yup.string(),
    openingId: Yup.number().required('Select an opening!'),
    successfulApplicant: Yup.number().required('Select a succesful applicant!'),
    includeReward: Yup.boolean(),
    rewardAmount: Yup.number()
      .when('includeReward', {
        is: true,
        then: minMaxInt(MIN_REWARD_AMOUNT, MAX_REWARD_AMOUNT, 'Reward amount')
      }),
    rewardNextBlock: Yup.number()
      .when('includeReward', {
        is: true,
        then: minMaxInt(
          MIN_NEXT_PAYMENT_BLOCK_MINUS_CURRENT + currentBlock,
          MAX_NEXT_PAYMENT_BLOCK_MINUS_CURRENT + currentBlock,
          'Next payment block'
        )
      }),
    rewardRecurring: Yup.boolean(),
    rewardInterval: Yup.number()
      .when(['includeReward', 'rewardRecurring'], {
        is: true,
        then: minMaxInt(MIN_REWARD_INTERVAL, MAX_REWARD_INTERVAL, 'Reward interval')
      })
  }),
  DecreaseWorkingGroupLeaderStake: () => ({
    workingGroup: Yup.string(),
    amount: Yup.number()
      .required('Amount is required!')
      .min(DECREASE_LEAD_STAKE_MIN, `Amount must be greater than ${DECREASE_LEAD_STAKE_MIN}`)
  }),
  SlashWorkingGroupLeaderStake: () => ({
    workingGroup: Yup.string(),
    amount: Yup.number()
      .required('Amount is required!')
      .min(SLASH_LEAD_STAKE_MIN, `Amount must be greater than ${SLASH_LEAD_STAKE_MIN}`)
  }),
  SetWorkingGroupLeaderReward: () => ({
    workingGroup: Yup.string(),
    amount: minMaxInt(MIN_REWARD_AMOUNT, MAX_REWARD_AMOUNT, 'Reward amount')
  }),
  TerminateWorkingGroupLeaderRole: ({ min, max }: InputValidationLengthConstraint) => ({
    workingGroup: Yup.string(),
    terminationRationale: Yup.string()
      .required('Termination rationale is required')
      .min(min.toNumber(), `Termination rationale must be at least ${min.toNumber()} character(s) long`)
      .max(max.toNumber(), `Termination rationale cannot be more than ${max.toNumber()} character(s) long`),
    slashStake: Yup.boolean()
  })
};

export default Validation;
