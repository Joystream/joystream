import { WorkingGroups } from './working_groups';
import { OpeningType } from '@joystream/types/working-group';

export type OpeningMetadata = {
  id: string;
  group: WorkingGroups;
  type?: OpeningType;
}

export type OpeningMetadataProps = {
  meta: OpeningMetadata;
}
