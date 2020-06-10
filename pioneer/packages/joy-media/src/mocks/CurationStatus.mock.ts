import { newEntityId } from './EntityId.mock';
import { CurationStatusType } from '../schemas/general/CurationStatus';

function newEntity (value: string): CurationStatusType {
  return { id: newEntityId(), value } as unknown as CurationStatusType; // A hack to fix TS compilation.
}

export const CurationStatus = {
  Edited: newEntity('Edited'),
  UpdatedSchema: newEntity('Updated schema'),
  UnderReview: newEntity('Under review'),
  Removed: newEntity('Removed')
};

export const AllCurationStatuses: CurationStatusType[] =
  Object.values(CurationStatus);

export const DefaultCurationStatus = CurationStatus.Edited;
