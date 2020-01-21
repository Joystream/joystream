import { newEntityId } from './EntityId.mock';
import { CurationStatusType } from '../schemas/general/CurationStatus';

const values = [
  'Edited',
  'Updated schema',
  'Under review',
  'Removed'
];

export const AllCurationStatuses: CurationStatusType[] =
  values.map(value => ({ id: newEntityId(), value }));

export const CurationStatus = AllCurationStatuses[0];
