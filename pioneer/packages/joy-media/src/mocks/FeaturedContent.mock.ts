import { newEntityId } from './EntityId.mock';
import { FeaturedContentType } from '../schemas/general/FeaturedContent';
import { AllVideos, AllMusicAlbums, Video } from '.';

export const FeaturedContent: FeaturedContentType = {
  id: newEntityId(),
  topVideo: Video,
  featuredVideos: AllVideos,
  featuredAlbums: AllMusicAlbums
} as unknown as FeaturedContentType // A hack to fix TS compilation.