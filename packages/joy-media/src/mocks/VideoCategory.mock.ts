import { newEntityId } from './EntityId.mock';
import { VideoCategoryType } from '../schemas/video/VideoCategory';

const values = [
  'Film & Animation',
  'Autos & Vehicles',
  'Music',
  'Pets & Animals',
  'Sports',
  'Travel & Events',
  'Gaming',
  'People & Blogs',
  'Comedy',
  'News & Politics',
];

export const AllVideoCategories: VideoCategoryType[] =
  values.map(value => ({ id: newEntityId(), value }));

export const VideoCategory = AllVideoCategories[0];
