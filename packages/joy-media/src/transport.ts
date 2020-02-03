import { Transport as TransportBase, Subscribable } from '@polkadot/joy-utils/index'
import EntityId from '@joystream/types/versioned-store/EntityId';
import { Entity, Class } from '@joystream/types/versioned-store';
import { MemberId } from '@joystream/types/members';
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
import { MediaDropdownOptions } from './common/MediaDropdownOptions';
import { ChannelEntity } from './entities/ChannelEntity';
import { ChannelId } from '@joystream/types/content-working-group';

export abstract class MediaTransport extends TransportBase {

  protected notImplementedYet<T> (): T {
    throw new Error('Substrate transport is not implemented yet');
  }

  abstract allChannels(): Promise<ChannelEntity[]>
  abstract channelById(id: ChannelId): Promise<ChannelType>
  abstract channelsByOwner(memberId: MemberId): Promise<ChannelEntity[]>
  abstract videosByChannelId(channelId: ChannelId): Promise<VideoType[]>

  abstract musicTrackClass(): Promise<Class>
  abstract musicAlbumClass(): Promise<Class>
  abstract videoClass(): Promise<Class>
  
  abstract musicTrackById(id: EntityId): Promise<MusicTrackType>
  abstract musicAlbumById(id: EntityId): Promise<MusicAlbumType>
  abstract videoById(id: EntityId): Promise<VideoType>

  abstract allContentLicenses(): Promise<ContentLicenseType[]>
  abstract allCurationStatuses(): Promise<CurationStatusType[]>
  abstract allLanguages(): Promise<LanguageType[]>
  abstract allMediaObjects(): Promise<MediaObjectType[]>
  abstract allMusicGenres(): Promise<MusicGenreType[]>
  abstract allMusicMoods(): Promise<MusicMoodType[]>
  abstract allMusicThemes(): Promise<MusicThemeType[]>
  abstract allPublicationStatuses(): Promise<PublicationStatusType[]>
  abstract allVideoCategories(): Promise<VideoCategoryType[]>

  // State
  abstract allEntities(): Subscribable<Entity[]>

  async dropdownOptions(): Promise<MediaDropdownOptions> {
    return new MediaDropdownOptions({
      languages: await this.allLanguages(),
      contentLicenses: await this.allContentLicenses(),
      curationStatuses: await this.allCurationStatuses(),
      musicGenres: await this.allMusicGenres(),
      musicMoods: await this.allMusicMoods(),
      musicThemes: await this.allMusicThemes(),
      publicationStatuses: await this.allPublicationStatuses(),
      videoCategories: await this.allVideoCategories()
    });
  }
}
