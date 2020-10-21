export const apiModuleByGroup = {
  Storage: 'storageWorkingGroup',
  Content: 'contentDirectoryWorkingGroup',
} as const

export const stakingPolicyUnstakingPeriodKeys = [
  'crowded_out_unstaking_period_length',
  'review_period_expired_unstaking_period_length',
] as const

export const openingPolicyUnstakingPeriodsKeys = [
  'fill_opening_failed_applicant_application_stake_unstaking_period',
  'fill_opening_failed_applicant_role_stake_unstaking_period',
  'fill_opening_successful_applicant_application_stake_unstaking_period',
  'terminate_application_stake_unstaking_period',
  'terminate_role_stake_unstaking_period',
  'exit_role_application_stake_unstaking_period',
  'exit_role_stake_unstaking_period',
] as const
