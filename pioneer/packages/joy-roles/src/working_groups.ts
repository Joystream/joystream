export enum WorkingGroups {
  ContentCurators = 'curators',
  StorageProviders = 'storageProviders'
}

export const AvailableGroups: readonly WorkingGroups[] = [
  WorkingGroups.ContentCurators,
  WorkingGroups.StorageProviders
] as const;
