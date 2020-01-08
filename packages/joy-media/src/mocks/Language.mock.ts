import { newEntityId } from './EntityId.mock';
import { LanguageType } from '../schemas/general/Language';

const values = [
  'en',
  'cn',
  'hi',
  'es',
  'pt',
  'de',
  'ru',
  'ja',
  'no',
];

export const AllLanguages: LanguageType[] =
  values.map(value => ({ id: newEntityId(), value }));

export const Language = AllLanguages[0];
