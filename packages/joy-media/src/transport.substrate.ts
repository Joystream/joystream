import { MediaTransport } from './transport';
import { Subscribable } from '@polkadot/joy-utils/Subscribable';
import EntityId from '@joystream/types/versioned-store/EntityId';
import { Entity, Class } from '@joystream/types/versioned-store';
import { MusicTrackType } from './schemas/music/MusicTrack';
import { MusicAlbumType } from './schemas/music/MusicAlbum';
import { VideoType } from './schemas/video/Video';
import { ChannelType } from './schemas/channel/Channel';
import { ContentLicenseType } from './schemas/general/ContentLicense';
import { CurationStatusType } from './schemas/general/CurationStatus';
import { LanguageType } from './schemas/general/Language';
import { MediaObjectType } from './schemas/general/MediaObject';
import { MusicGenreType } from './schemas/music/MusicGenre';
import { MusicMoodType } from './schemas/music/MusicMood';
import { MusicThemeType } from './schemas/music/MusicTheme';
import { PublicationStatusType } from './schemas/general/PublicationStatus';
import { VideoCategoryType } from './schemas/video/VideoCategory';
import { MemberId } from 'packages/joy-types/lib/members';
import { ChannelEntity } from './entities/ChannelEntity';
import { ChannelId } from '@joystream/types/content-working-group';

export class SubstrateTransport extends MediaTransport {

  allChannels(): Promise<ChannelEntity[]> {
    return this.notImplementedYet(); // TODO impl
  }

  channelById (_id: ChannelId): Promise<ChannelType> {
    return this.notImplementedYet(); // TODO impl
  }

  channelsByOwner(_memberId: MemberId): Promise<ChannelEntity[]> {
    return this.notImplementedYet(); // TODO impl
  }

  allVideos(): Promise<VideoType[]> {
    return this.notImplementedYet(); // TODO impl
  }

  videosByChannelId(channelId: ChannelId): Promise<VideoType[]> {
    return this.notImplementedYet(); // TODO impl
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
    return this.notImplementedYet(); // TODO impl
  }

  musicAlbumById (_id: EntityId): Promise<MusicAlbumType> {
    return this.notImplementedYet(); // TODO impl
  }

  videoById (_id: EntityId): Promise<VideoType> {
    return this.notImplementedYet(); // TODO impl
  }

  allContentLicenses (): Promise<ContentLicenseType[]> {
    return this.notImplementedYet(); // TODO impl
  }

  allCurationStatuses(): Promise<CurationStatusType[]> {
    return this.notImplementedYet(); // TODO impl
  }

  allLanguages(): Promise<LanguageType[]> {
    return this.notImplementedYet(); // TODO impl
  }

  allMediaObjects(): Promise<MediaObjectType[]> {
    return this.notImplementedYet(); // TODO impl
  }

  allMusicGenres(): Promise<MusicGenreType[]> {
    return this.notImplementedYet(); // TODO impl
  }

  allMusicMoods(): Promise<MusicMoodType[]> {
    return this.notImplementedYet(); // TODO impl
  }

  allMusicThemes(): Promise<MusicThemeType[]> {
    return this.notImplementedYet(); // TODO impl
  }

  allPublicationStatuses(): Promise<PublicationStatusType[]> {
    return this.notImplementedYet(); // TODO impl
  }

  allVideoCategories(): Promise<VideoCategoryType[]> {
    return this.notImplementedYet(); // TODO impl
  }

  allEntities (): Subscribable<Entity[]> {
    return this.notImplementedYet(); // TODO impl
  }
}
