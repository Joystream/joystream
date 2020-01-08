import { newEntityId } from './EntityId.mock';
import { VideoCategoryType } from '../schemas/video/VideoCategory';

const values = [
  ''
];

export const AllVideoCategories: VideoCategoryType[] =
  values.map(value => ({ id: newEntityId(), value }));

export const VideoCategory = AllVideoCategories[0];
