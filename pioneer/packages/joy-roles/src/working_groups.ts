export enum WorkingGroups {
  ContentCurators = 'curators',
  StorageProviders = 'storageProviders',
  OperationsAlpha = 'operationsGroupAlpha',
  OperationsBeta = 'operationsGroupBeta',
  OperationsGamma = 'operationsGroupGamma',
  Distribution = 'distribution'
}

export const AvailableGroups: readonly WorkingGroups[] = [
  WorkingGroups.ContentCurators,
  WorkingGroups.StorageProviders,
  WorkingGroups.OperationsAlpha,
  WorkingGroups.OperationsBeta,
  WorkingGroups.OperationsGamma,
  WorkingGroups.Distribution
] as const;

export const workerRoleNameByGroup: { [key in WorkingGroups]: string } = {
  [WorkingGroups.ContentCurators]: 'Content Curator',
  [WorkingGroups.StorageProviders]: 'Storage Provider',
  [WorkingGroups.OperationsAlpha]: 'Operations Group Alpha Worker',
  [WorkingGroups.OperationsBeta]: 'Operations Group Beta Worker',
  [WorkingGroups.OperationsGamma]: 'Operations Group Gamma Worker',
  [WorkingGroups.Distribution]: 'Distribution'
};
