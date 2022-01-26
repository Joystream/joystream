export type WorkingGroupTokenomicsData = {
  number: number;
  totalStake: number;
  stakeShare: number;
  rewardsPerWeek: number;
  rewardsShare: number;
  lead: {
    number: number;
    totalStake: number;
    stakeShare: number;
    rewardsPerWeek: number;
    rewardsShare: number;
  };
}

export type TokenomicsData = {
  totalIssuance: number;
  currentlyStakedTokens: number;
  totalWeeklySpending: number;
  totalNumberOfActors: number;
  validators: {
    number: number;
    nominators: {
      number: number;
    };
    rewardsPerWeek: number;
    rewardsShare: number;
    totalStake: number;
    stakeShare: number;
  };
  council: {
    number: number;
    rewardsPerWeek: number;
    rewardsShare: number;
    totalStake: number;
    stakeShare: number;
  };
  storageProviders: WorkingGroupTokenomicsData;
  contentCurators: WorkingGroupTokenomicsData;
  operationsAlpha: WorkingGroupTokenomicsData;
  operationsBeta: WorkingGroupTokenomicsData;
  operationsGamma: WorkingGroupTokenomicsData;
  distribution: WorkingGroupTokenomicsData;
}

export type StatusServerData = {
  dollarPool: {
    size: number;
    replenishAmount: number;
  };
  price: string;
};
