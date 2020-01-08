import { newEntityId } from './EntityId.mock';
import { ContentLicenseType } from '../schemas/general/ContentLicense';

const values = [
  ''
];

export const AllContentLicenses: ContentLicenseType[] =
  values.map(value => ({ id: newEntityId(), value }));

export const ContentLicense = AllContentLicenses[0];
