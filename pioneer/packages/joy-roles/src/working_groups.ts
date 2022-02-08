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
  [WorkingGroups.OperationsAlpha]: 'Builder',
  [WorkingGroups.OperationsBeta]: 'HR Worker',
  [WorkingGroups.OperationsGamma]: 'Marketer',
  [WorkingGroups.Distribution]: 'Distributor'
};
