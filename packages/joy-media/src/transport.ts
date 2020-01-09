import { Subscribable } from '@polkadot/joy-utils/index'
import EntityId from '@joystream/types/versioned-store/EntityId';
import { Entity } from '@joystream/types/versioned-store';
import { MusicTrackType } from './schemas/music/MusicTrack';
import { MusicAlbumType } from './schemas/music/MusicAlbum';
import { VideoType } from './schemas/video/Video';
import { ChannelType } from './schemas/channel/Channel';
import { ChannelId } from './channels/ChannelId';
import { ContentLicenseType } from './schemas/general/ContentLicense';
import { CurationStatusType } from './schemas/general/CurationStatus';
import { LanguageType } from './schemas/general/Language';
import { MediaObjectType } from './schemas/general/MediaObject';
import { MusicGenreType } from './schemas/music/MusicGenre';
import { MusicMoodType } from './schemas/music/MusicMood';
import { MusicThemeType } from './schemas/music/MusicTheme';
import { PublicationStatusType } from './schemas/general/PublicationStatus';
import { VideoCategoryType } from './schemas/video/VideoCategory';

export interface ITransport {
  
  // Funcs
  musicTrackById: (id: EntityId) => Promise<MusicTrackType>
  musicAlbumById: (id: EntityId) => Promise<MusicAlbumType>
  videoById: (id: EntityId) => Promise<VideoType>
  channelById: (id: ChannelId) => Promise<ChannelType>

  allContentLicenses (): Promise<ContentLicenseType[]>
  allCurationStatuses(): Promise<CurationStatusType[]>
  allLanguages(): Promise<LanguageType[]>
  allMediaObjects(): Promise<MediaObjectType[]>
  allMusicGenres(): Promise<MusicGenreType[]>
  allMusicMoods(): Promise<MusicMoodType[]>
  allMusicThemes(): Promise<MusicThemeType[]>
  allPublicationStatuses(): Promise<PublicationStatusType[]>
  allVideoCategories(): Promise<VideoCategoryType[]>

  // State
  allEntities: () => Subscribable<Entity[]>
}
