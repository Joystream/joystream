import { MediaTransport, ChannelValidationConstraints } from './transport';
import { Entity, Class } from '@joystream/types/versioned-store';
import { MusicTrackType } from './schemas/music/MusicTrack';
import { MusicAlbumType } from './schemas/music/MusicAlbum';
import { VideoType } from './schemas/video/Video';

import * as mocks from './mocks';
import { ContentLicenseType } from './schemas/general/ContentLicense';
import { CurationStatusType } from './schemas/general/CurationStatus';
import { FeaturedContentType } from './schemas/general/FeaturedContent';
import { LanguageType } from './schemas/general/Language';
import { MediaObjectType } from './schemas/general/MediaObject';
import { MusicGenreType } from './schemas/music/MusicGenre';
import { MusicMoodType } from './schemas/music/MusicMood';
import { MusicThemeType } from './schemas/music/MusicTheme';
import { PublicationStatusType } from './schemas/general/PublicationStatus';
import { VideoCategoryType } from './schemas/video/VideoCategory';
import { ChannelEntity } from './entities/ChannelEntity';
import { AllMockChannels } from './stories/data/ChannelSamples';
import { mockPromise } from '@polkadot/joy-utils/transport/mock/base';

export class MockTransport extends MediaTransport {
  constructor () {
    super();
    console.log('Create new MockTransport');
  }

  protected notImplementedYet<T> (): T {
    throw new Error('Mock transport: Requested function is not implemented yet');
  }

  allChannels (): Promise<ChannelEntity[]> {
    return mockPromise(AllMockChannels);
  }

  channelValidationConstraints (): Promise<ChannelValidationConstraints> {
    return this.notImplementedYet(); // TODO impl
  }

  allClasses (): Promise<Class[]> {
    return this.notImplementedYet(); // TODO impl
  }

  allEntities (): Promise<Entity[]> {
    return this.notImplementedYet(); // TODO impl
  }

  allVideos (): Promise<VideoType[]> {
    return mockPromise(mocks.AllVideos);
  }

  allMusicTracks (): Promise<MusicTrackType[]> {
    return mockPromise(mocks.AllMusicTracks);
  }

  allMusicAlbums (): Promise<MusicAlbumType[]> {
    return mockPromise(mocks.AllMusicAlbums);
  }

  featuredContent (): Promise<FeaturedContentType | undefined> {
    return mockPromise(mocks.FeaturedContent);
  }

  allContentLicenses (): Promise<ContentLicenseType[]> {
    return mockPromise(mocks.AllContentLicenses);
  }

  allCurationStatuses (): Promise<CurationStatusType[]> {
    return mockPromise(mocks.AllCurationStatuses);
  }

  allLanguages (): Promise<LanguageType[]> {
    return mockPromise(mocks.AllLanguages);
  }

  allMediaObjects (): Promise<MediaObjectType[]> {
    return mockPromise(mocks.AllMediaObjects);
  }

  allMusicGenres (): Promise<MusicGenreType[]> {
    return mockPromise(mocks.AllMusicGenres);
  }

  allMusicMoods (): Promise<MusicMoodType[]> {
    return mockPromise(mocks.AllMusicMoods);
  }

  allMusicThemes (): Promise<MusicThemeType[]> {
    return mockPromise(mocks.AllMusicThemes);
  }

  allPublicationStatuses (): Promise<PublicationStatusType[]> {
    return mockPromise(mocks.AllPublicationStatuses);
  }

  allVideoCategories (): Promise<VideoCategoryType[]> {
    return mockPromise(mocks.AllVideoCategories);
  }
}
