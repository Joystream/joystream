import { newEntityId } from './EntityId.mock';
import { CurationStatusType } from '../schemas/general/CurationStatus';

const values = [
  'Edited',
  'Updated schema',
  'Under review',
  'Removed'
];

export const AllCurationStatuss: CurationStatusType[] =
  values.map(value => ({ id: newEntityId(), value }));

export const CurationStatus = AllCurationStatuss[0];
