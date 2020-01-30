import { Observable } from 'rxjs';
import { Subscribable } from '@polkadot/joy-utils/index'
import { MediaTransport } from './transport';

import EntityId from '@joystream/types/versioned-store/EntityId';
import { Entity, Class } from '@joystream/types/versioned-store';
import { MusicTrackType } from './schemas/music/MusicTrack';
import { MusicAlbumType } from './schemas/music/MusicAlbum';
import { VideoType } from './schemas/video/Video';
import { ChannelType } from './schemas/channel/Channel';
import { ChannelId } from './channels/ChannelId';

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
import { MemberId } from '@joystream/types/members';
import { ChannelEntity } from './entities/MusicChannelEntity';
import { ChannelsDataSamples } from './stories/data/ChannelSamples';

export class MockTransport extends MediaTransport {

  channelsByOwner(_memberId: MemberId): Promise<ChannelEntity[]> {
    return this.promise(ChannelsDataSamples);
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

  videoById (_id: EntityId): Promise<VideoType> {
    return this.promise(mocks.Video);
  }

  channelById (_id: ChannelId): Promise<ChannelType> {
    return this.promise(mocks.Channel);
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
  
  allEntities (): Subscribable<Entity[]> {
    return new Observable<Entity[]>(observer => {
      observer.next(
        [] // TODO create mock data
      );
    });
  }
}
