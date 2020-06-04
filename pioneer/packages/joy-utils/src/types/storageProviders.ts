export const StorageRoleParameters = [
  'min_stake',
  'min_actors',
  'max_actors',
  'reward',
  'reward_period',
  'bonding_period',
  'unbonding_period',
  'min_service_period',
  'startup_grace_period',
  'entry_request_fee'
] as const;

export type IStorageRoleParameters = {
  [k in typeof StorageRoleParameters[number]]: number;
};
