import { newEntityId } from './EntityId.mock';
import { LanguageType } from '../schemas/general/Language';

const values = [
  ''
];

export const AllLanguages: LanguageType[] =
  values.map(value => ({ id: newEntityId(), value }));

export const Language = AllLanguages[0];
