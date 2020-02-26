import { MediaTransport, ChannelValidationConstraints } from './transport';
import { EntityId, Entity, Class } from '@joystream/types/versioned-store';
import { MusicTrackType } from './schemas/music/MusicTrack';
import { MusicAlbumType } from './schemas/music/MusicAlbum';
import { VideoType } from './schemas/video/Video';

import * as mocks from './mocks';
import { ContentLicenseType } from './schemas/general/ContentLicense';
import { CurationStatusType } from './schemas/general/CurationStatus';
import { LanguageType } from './schemas/general/Language';
import { MediaObjectType } from './schemas/general/MediaObject';
import { MusicGenreType } from './schemas/music/MusicGenre';
import { MusicMoodType } from './schemas/music/MusicMood';
import { MusicThemeType } from './schemas/music/MusicTheme';
import { PublicationStatusType } from './schemas/general/PublicationStatus';
import { VideoCategoryType } from './schemas/video/VideoCategory';
import { ChannelEntity } from './entities/ChannelEntity';
import { AllMockChannels } from './stories/data/ChannelSamples';

export class MockTransport extends MediaTransport {

  protected notImplementedYet<T> (): T {
    throw new Error('Mock transport: Requested function is not implemented yet')
  }

  allChannels(): Promise<ChannelEntity[]> {
    return this.promise(AllMockChannels);
  }

  channelValidationConstraints(): Promise<ChannelValidationConstraints> {
    return this.notImplementedYet(); // TODO impl
  }

  allClasses(): Promise<Class[]> {
    return this.notImplementedYet(); // TODO impl
  }

  allVideos(): Promise<VideoType[]> {
    return this.promise(mocks.AllVideos)
  }

  featuredVideos(): Promise<VideoType[]> {
    return this.promise(mocks.AllVideos)
  }

  musicTrackClass(): Promise<Class> {
    return this.notImplementedYet(); // TODO impl
  }

  musicAlbumClass(): Promise<Class> {
    return this.notImplementedYet(); // TODO impl
  }

  videoClass(): Promise<Class> {
    return this.notImplementedYet(); // TODO impl
  }

  musicTrackById (_id: EntityId): Promise<MusicTrackType> {
    return this.promise(mocks.MusicTrack);
  }

  musicAlbumById (_id: EntityId): Promise<MusicAlbumType> {
    return this.promise(mocks.MusicAlbum);
  }

  allContentLicenses (): Promise<ContentLicenseType[]> {
    return this.promise(mocks.AllContentLicenses);
  }

  allCurationStatuses(): Promise<CurationStatusType[]> {
    return this.promise(mocks.AllCurationStatuses);
  }

  allLanguages(): Promise<LanguageType[]> {
    return this.promise(mocks.AllLanguages);
  }

  allMediaObjects(): Promise<MediaObjectType[]> {
    return this.promise(mocks.AllMediaObjects);
  }

  allMusicGenres(): Promise<MusicGenreType[]> {
    return this.promise(mocks.AllMusicGenres);
  }

  allMusicMoods(): Promise<MusicMoodType[]> {
    return this.promise(mocks.AllMusicMoods);
  }

  allMusicThemes(): Promise<MusicThemeType[]> {
    return this.promise(mocks.AllMusicThemes);
  }

  allPublicationStatuses(): Promise<PublicationStatusType[]> {
    return this.promise(mocks.AllPublicationStatuses);
  }

  allVideoCategories(): Promise<VideoCategoryType[]> {
    return this.promise(mocks.AllVideoCategories);
  }
  
  allEntities (): Promise<Entity[]> {
    return this.notImplementedYet(); // TODO impl
  }
}
