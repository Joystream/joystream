export enum WorkingGroups {
  ContentCurators = 'curators',
  StorageProviders = 'storageProviders',
  Operations = 'operationsGroup'
}

export const AvailableGroups: readonly WorkingGroups[] = [
  WorkingGroups.ContentCurators,
  WorkingGroups.StorageProviders,
  WorkingGroups.Operations
] as const;

export const workerRoleNameByGroup: { [key in WorkingGroups]: string } = {
  [WorkingGroups.ContentCurators]: 'Content Curator',
  [WorkingGroups.StorageProviders]: 'Storage Provider',
  [WorkingGroups.Operations]: 'Operations Group Worker'
};
