import { MediaTransport } from './transport';
import EntityId from '@joystream/types/versioned-store/EntityId';
import { Entity } from '@joystream/types/versioned-store';
import { MusicTrackType } from './schemas/music/MusicTrack';
import { MusicAlbumType } from './schemas/music/MusicAlbum';
import { VideoType } from './schemas/video/Video';
import { ChannelId } from './channels/ChannelId';
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

function notImplementedYet (): any {
  throw new Error('Substrate transport is not implemented yet');
}

export class SubstrateTransport extends MediaTransport {

  musicTrackById (_id: EntityId): Promise<MusicTrackType> {
    return notImplementedYet(); // TODO impl
  }

  musicAlbumById (_id: EntityId): Promise<MusicAlbumType> {
    return notImplementedYet(); // TODO impl
  }

  videoById (_id: EntityId): Promise<VideoType> {
    return notImplementedYet(); // TODO impl
  }

  channelById (_id: ChannelId): Promise<ChannelType> {
    return notImplementedYet(); // TODO impl
  }

  allContentLicenses (): Promise<ContentLicenseType[]> {
    return notImplementedYet(); // TODO impl
  }

  allCurationStatuses(): Promise<CurationStatusType[]> {
    return notImplementedYet(); // TODO impl
  }

  allLanguages(): Promise<LanguageType[]> {
    return notImplementedYet(); // TODO impl
  }

  allMediaObjects(): Promise<MediaObjectType[]> {
    return notImplementedYet(); // TODO impl
  }

  allMusicGenres(): Promise<MusicGenreType[]> {
    return notImplementedYet(); // TODO impl
  }

  allMusicMoods(): Promise<MusicMoodType[]> {
    return notImplementedYet(); // TODO impl
  }

  allMusicThemes(): Promise<MusicThemeType[]> {
    return notImplementedYet(); // TODO impl
  }

  allPublicationStatuses(): Promise<PublicationStatusType[]> {
    return notImplementedYet(); // TODO impl
  }

  allVideoCategories(): Promise<VideoCategoryType[]> {
    return notImplementedYet(); // TODO impl
  }

  allEntities (): Subscribable<Entity[]> {
    return notImplementedYet(); // TODO impl
  }
}
