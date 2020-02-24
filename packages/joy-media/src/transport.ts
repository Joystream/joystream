import { Transport as TransportBase } from '@polkadot/joy-utils/index'
import { AccountId } from '@polkadot/types/interfaces';
import { EntityId, Entity, Class, ClassId } from '@joystream/types/versioned-store';
import { MusicTrackType, MusicTrackCodec } from './schemas/music/MusicTrack';
import { MusicAlbumType, MusicAlbumCodec } from './schemas/music/MusicAlbum';
import { VideoType, VideoCodec } from './schemas/video/Video';
import { ContentLicenseType, ContentLicenseCodec } from './schemas/general/ContentLicense';
import { CurationStatusType, CurationStatusCodec } from './schemas/general/CurationStatus';
import { LanguageType, LanguageCodec } from './schemas/general/Language';
import { MediaObjectType, MediaObjectCodec } from './schemas/general/MediaObject';
import { MusicGenreType, MusicGenreCodec } from './schemas/music/MusicGenre';
import { MusicMoodType, MusicMoodCodec } from './schemas/music/MusicMood';
import { MusicThemeType, MusicThemeCodec } from './schemas/music/MusicTheme';
import { PublicationStatusType, PublicationStatusCodec } from './schemas/general/PublicationStatus';
import { VideoCategoryType, VideoCategoryCodec } from './schemas/video/VideoCategory';
import { MediaDropdownOptions } from './common/MediaDropdownOptions';
import { ChannelEntity } from './entities/ChannelEntity';
import { ChannelId } from '@joystream/types/content-working-group';
import { isVideoChannel, isPublicChannel } from './channels/ChannelHelpers';
import { isPublicEntity } from './entities/EntityHelpers';
import { camelCase, upperFirst } from 'lodash'

export interface ValidationConstraint {
  min: number
  max: number
}

export interface ChannelValidationConstraints {
  handle: ValidationConstraint
  title: ValidationConstraint
  description: ValidationConstraint
  avatar: ValidationConstraint
  banner: ValidationConstraint
}

export interface ClassIdByNameMap {
  ContentLicense?: ClassId
  CurationStatus?: ClassId
  Language?: ClassId
  MediaObject?: ClassId
  MusicAlbum?: ClassId
  MusicGenre?: ClassId
  MusicMood?: ClassId
  MusicTheme?: ClassId
  MusicTrack?: ClassId
  PublicationStatus?: ClassId
  Video?: ClassId
  VideoCategory?: ClassId
}

export const EntityCodecByClassNameMap = {
  ContentLicense: ContentLicenseCodec,
  CurationStatus: CurationStatusCodec,
  Language: LanguageCodec,
  MediaObject: MediaObjectCodec,
  MusicAlbum: MusicAlbumCodec,
  MusicGenre: MusicGenreCodec,
  MusicMood: MusicMoodCodec,
  MusicTheme: MusicThemeCodec,
  MusicTrack: MusicTrackCodec,
  PublicationStatus: PublicationStatusCodec,
  Video: VideoCodec,
  VideoCategory: VideoCategoryCodec,
}

export type ClassName = keyof ClassIdByNameMap

export function unifyClassName(className: string): ClassName {
  return upperFirst(camelCase(className)) as ClassName
}

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

  abstract channelValidationConstraints(): Promise<ChannelValidationConstraints>

  abstract allClasses(): Promise<Class[]>

  async classByName(className: ClassName): Promise<Class | undefined> {
    return (await this.allClasses())
      .find((x) => className === unifyClassName(x.name))
  }

  // TODO Save result of this func in context state and subscribe to updates from Substrate.
  async classIdByNameMap(): Promise<ClassIdByNameMap> {
    const map: ClassIdByNameMap = {}
    const classes = await this.allClasses()
    classes.forEach((x) => {
      const className = unifyClassName(x.name)
      map[className] = x.id
    });
    return map
  }

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
