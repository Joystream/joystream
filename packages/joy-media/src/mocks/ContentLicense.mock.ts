import { newEntityId } from './EntityId.mock';
import { ContentLicenseType } from '../schemas/general/ContentLicense';

const values = [
  'Public Domain',
  'Share Alike',
  'No Derivatives',
  'No Commercial',
];

export const AllContentLicenses: ContentLicenseType[] =
  values.map(value => ({ id: newEntityId(), value }));

export const ContentLicense = AllContentLicenses[0];
