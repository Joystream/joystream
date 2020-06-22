export enum WorkingGroups {
  ContentCurators = 'curators',
  StorageProviders = 'storageProviders'
}

export const AvailableGroups: readonly WorkingGroups[] = [
  WorkingGroups.ContentCurators,
  WorkingGroups.StorageProviders
] as const;

export const workerRoleNameByGroup: { [key in WorkingGroups]: string } = {
  [WorkingGroups.ContentCurators]: 'Content Curator',
  [WorkingGroups.StorageProviders]: 'Storage Provider'
};
