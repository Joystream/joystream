import { newEntityId } from './EntityId.mock';
import { CurationStatusType } from '../schemas/general/CurationStatus';

const values = [
  'Approved',
  'Moderated',
];

export const AllCurationStatuss: CurationStatusType[] =
  values.map(value => ({ id: newEntityId(), value }));

export const CurationStatus = AllCurationStatuss[0];
