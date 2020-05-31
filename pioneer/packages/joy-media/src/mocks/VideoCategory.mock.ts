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
  'Entertainment',
  'News & Politics',
  'Howto & Style',
  'Education',
  'Science & Technology',
  'Nonprofits & Activism'
];

export const AllVideoCategories: VideoCategoryType[] =
  values.map(value => ({ id: newEntityId(), value })) as unknown as VideoCategoryType[] // A hack to fix TS compilation.

export const VideoCategory = AllVideoCategories[0];
