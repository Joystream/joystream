import { WorkingGroups } from './working_groups';

export type OpeningMetadata = {
  id: string;
  group: WorkingGroups;
}

export type OpeningMetadataProps = {
  meta: OpeningMetadata;
}
