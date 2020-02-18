import { Transport as TransportBase } from '@polkadot/joy-utils/index'
import { AccountId } from '@polkadot/types/interfaces';
import { EntityId, Entity, Class } from '@joystream/types/versioned-store';
import { MusicTrackType } from './schemas/music/MusicTrack';
import { MusicAlbumType } from './schemas/music/MusicAlbum';
import { VideoType } from './schemas/video/Video';
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
import { isVideoChannel, isPublicChannel } from './channels/ChannelHelpers';
import { isPublicEntity } from './entities/EntityHelpers';

export abstract class MediaTransport extends TransportBase {

  protected abstract notImplementedYet<T> (): T

  abstract allChannels(): Promise<ChannelEntity[]>

  async channelById(id: ChannelId): Promise<ChannelEntity | undefined> {
    return (await this.allChannels())
      .find(x => id && id.eq(x.id))
  }

  async channelsByAccount(accountId: AccountId): Promise<ChannelEntity[]> {
    return (await this.allChannels())
      .filter(x => accountId && accountId.eq(x.roleAccount))
  }

  abstract allClasses(): Promise<Class[]>

  abstract allVideos(): Promise<VideoType[]>

  abstract featuredVideos(): Promise<VideoType[]>

  async videosByChannelId(channelId: ChannelId): Promise<VideoType[]> {
    return (await this.allVideos())
      .filter(x => channelId && channelId.eq(x.channelId))
  }

  async videosByAccount(accountId: AccountId): Promise<VideoType[]> {
    const accountChannels = await this.channelsByAccount(accountId)
    const accountChannelIds = new Set(accountChannels.map(x => x.id))

    return (await this.allVideos())
      .filter(x => x.channelId && accountChannelIds.has(x.channelId))
  }

  async videoById(id: EntityId): Promise<VideoType | undefined> {
    return (await this.allVideos())
      .find(x => id && id.eq(x.id))
  }

  async allPublicChannels(): Promise<ChannelEntity[]> {
    return (await this.allChannels())
      .filter(isPublicChannel)
  }

  async allVideoChannels(): Promise<ChannelEntity[]> {
    return (await this.allChannels())
      .filter(isVideoChannel)
  }

  async latestPublicVideoChannels(limit: number = 5): Promise<ChannelEntity[]> {
    return (await this.allVideoChannels())
      .filter(isPublicChannel)
      .sort(x => -1 * x.id)
      .slice(0, limit)
  }

  async latestPublicVideos(limit: number = 5): Promise<VideoType[]> {
    return (await this.allVideos())
      .filter(isPublicEntity)
      .sort(x => -1 * x.id)
      .slice(0, limit)
  }

  abstract musicTrackClass(): Promise<Class>
  abstract musicAlbumClass(): Promise<Class>
  abstract videoClass(): Promise<Class>
  
  abstract musicTrackById(id: EntityId): Promise<MusicTrackType>
  abstract musicAlbumById(id: EntityId): Promise<MusicAlbumType>

  abstract allMediaObjects(): Promise<MediaObjectType[]>

  abstract allContentLicenses(): Promise<ContentLicenseType[]>
  abstract allCurationStatuses(): Promise<CurationStatusType[]>
  abstract allLanguages(): Promise<LanguageType[]>
  abstract allMusicGenres(): Promise<MusicGenreType[]>
  abstract allMusicMoods(): Promise<MusicMoodType[]>
  abstract allMusicThemes(): Promise<MusicThemeType[]>
  abstract allPublicationStatuses(): Promise<PublicationStatusType[]>
  abstract allVideoCategories(): Promise<VideoCategoryType[]>

  abstract allEntities(): Promise<Entity[]>

  async dropdownOptions(): Promise<MediaDropdownOptions> {
    const res = new MediaDropdownOptions({
      contentLicenses: await this.allContentLicenses(),
      curationStatuses: await this.allCurationStatuses(),
      languages: await this.allLanguages(),
      musicGenres: await this.allMusicGenres(),
      musicMoods: await this.allMusicMoods(),
      musicThemes: await this.allMusicThemes(),
      publicationStatuses: await this.allPublicationStatuses(),
      videoCategories: await this.allVideoCategories()
    });
    //console.log('Transport.dropdownOptions', res);
    return res;
  }
}
