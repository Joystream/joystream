import { newEntityId } from './EntityId.mock';
import { MediaObjectType } from '../schemas/general/MediaObject';

const values = [
  ''
];

export const AllMediaObjects: MediaObjectType[] =
  values.map(value => ({ id: newEntityId(), value }));

export const MediaObject = AllMediaObjects[0];
