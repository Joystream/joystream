import { Transport as TransportBase } from '@polkadot/joy-utils/index'
import { AccountId } from '@polkadot/types/interfaces';
import { EntityId, Entity, Class, ClassName, unifyClassName, ClassIdByNameMap } from '@joystream/types/versioned-store';
import { InternalEntityResolvers } from '@joystream/types/versioned-store/EntityCodec';
import { MusicTrackType, MusicTrackCodec } from './schemas/music/MusicTrack';
import { MusicAlbumType, MusicAlbumCodec } from './schemas/music/MusicAlbum';
import { VideoType, VideoCodec } from './schemas/video/Video';
import { ContentLicenseType, ContentLicenseCodec } from './schemas/general/ContentLicense';
import { CurationStatusType, CurationStatusCodec } from './schemas/general/CurationStatus';
import { FeaturedContentType, FeaturedContentCodec } from './schemas/general/FeaturedContent';
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

export interface InternalEntities {
  languages: LanguageType[]
  contentLicenses: ContentLicenseType[]
  curationStatuses: CurationStatusType[]
  musicGenres: MusicGenreType[]
  musicMoods: MusicMoodType[]
  musicThemes: MusicThemeType[]
  publicationStatuses: PublicationStatusType[]
  videoCategories: VideoCategoryType[]
}

export const EntityCodecByClassNameMap = {
  ContentLicense: ContentLicenseCodec,
  CurationStatus: CurationStatusCodec,
  FeaturedContent: FeaturedContentCodec,
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

function insensitiveEq(text1: string, text2: string): boolean {
  const prepare = (txt: string) => txt.replace(/[\s]+/mg, '').toLowerCase()
  return prepare(text1) === prepare(text2)
}

export abstract class MediaTransport extends TransportBase {

  protected cachedClassIdByNameMap: ClassIdByNameMap | undefined

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

  async classIdByNameMap(): Promise<ClassIdByNameMap> {
    if (this.cachedClassIdByNameMap) return this.cachedClassIdByNameMap

    const map: ClassIdByNameMap = {}
    const classes = await this.allClasses()
    classes.forEach((x) => {
      const className = unifyClassName(x.name)
      map[className] = x.id
    });
    
    this.cachedClassIdByNameMap = map
    return map
  }

  abstract featuredContent(): Promise<FeaturedContentType | undefined>

  async topVideo(): Promise<VideoType | undefined> {
    const content = await this.featuredContent()
    const topVideoId = content?.topVideo as unknown as number | undefined
    return !topVideoId ? undefined : await this.videoById(new EntityId(topVideoId))
  }

  async featuredVideos(): Promise<VideoType[]> {
    const content = await this.featuredContent()
    const videoIds = (content?.featuredVideos || []) as unknown as number[]
    const videos = await Promise.all(videoIds.map((id) =>
      this.videoById(new EntityId(id))))
    return videos.filter(x => x !== undefined) as VideoType[]
  }

  async featuredAlbums(): Promise<MusicAlbumType[]> {
    const content = await this.featuredContent()
    const albumIds = (content?.featuredAlbums || []) as unknown as EntityId[]
    const albums = await Promise.all(albumIds.map((id) =>
      this.musicAlbumById(new EntityId(id))))
    return albums.filter(x => x !== undefined) as MusicAlbumType[]
  }

  abstract allMediaObjects(): Promise<MediaObjectType[]>

  abstract allVideos(): Promise<VideoType[]>

  abstract allMusicTracks(): Promise<MusicTrackType[]>

  abstract allMusicAlbums(): Promise<MusicAlbumType[]>

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

  async mediaObjectById(id: EntityId): Promise<MediaObjectType | undefined> {
    return (await this.allMediaObjects())
      .find(x => id && id.eq(x.id))
  }

  async videoById(id: EntityId): Promise<VideoType | undefined> {
    return (await this.allVideos())
      .find(x => id && id.eq(x.id))
  }

  async musicTrackById(id: EntityId): Promise<MusicTrackType | undefined> {
    return (await this.allMusicTracks())
      .find(x => id && id.eq(x.id))
  }

  async musicAlbumById(id: EntityId): Promise<MusicAlbumType | undefined> {
    return (await this.allMusicAlbums())
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

    const idOfPublicPS = (await this.allPublicationStatuses())
      .find(x =>
        insensitiveEq(x.value, 'Public')
      )?.id
    
    const idsOfCuratedCS = (await this.allCurationStatuses())
      .filter(x =>
        insensitiveEq(x.value, 'Under review') ||
        insensitiveEq(x.value, 'Removed')
      ).map(x => x.id)

    const isPublicAndNotCurated = (video: VideoType) => {
      const isPublic = video.publicationStatus.id === idOfPublicPS
      const isNotCurated = idsOfCuratedCS.indexOf(video.curationStatus?.id || -1) < 0
      return isPublic && isNotCurated
    }

    return (await this.allVideos())
      .filter(isPublicAndNotCurated)
      .sort(x => -1 * x.id)
      .slice(0, limit)
  }

  async mediaObjectClass() {
    return await this.classByName('MediaObject')
  }

  async videoClass() {
    return await this.classByName('Video')
  }

  async musicTrackClass() {
    return await this.classByName('MusicTrack')
  }

  async musicAlbumClass() {
    return await this.classByName('MusicAlbum')
  }

  abstract allContentLicenses(): Promise<ContentLicenseType[]>
  abstract allCurationStatuses(): Promise<CurationStatusType[]>
  abstract allLanguages(): Promise<LanguageType[]>
  abstract allMusicGenres(): Promise<MusicGenreType[]>
  abstract allMusicMoods(): Promise<MusicMoodType[]>
  abstract allMusicThemes(): Promise<MusicThemeType[]>
  abstract allPublicationStatuses(): Promise<PublicationStatusType[]>
  abstract allVideoCategories(): Promise<VideoCategoryType[]>

  abstract allEntities(): Promise<Entity[]>

  async allInternalEntities(): Promise<InternalEntities> {
    return {
      contentLicenses: await this.allContentLicenses(),
      curationStatuses: await this.allCurationStatuses(),
      languages: await this.allLanguages(),
      musicGenres: await this.allMusicGenres(),
      musicMoods: await this.allMusicMoods(),
      musicThemes: await this.allMusicThemes(),
      publicationStatuses: await this.allPublicationStatuses(),
      videoCategories: await this.allVideoCategories()
    }
  }

  async internalEntityResolvers(): Promise<InternalEntityResolvers> {
    const entities = await this.allInternalEntities()
    return {
      // MediaObject: undefined, // TODO think how to implement? or even need?
      ContentLicense: (id) => entities.contentLicenses.find(x => id.eq(x.id)),
      CurationStatus: (id) => entities.curationStatuses.find(x => id.eq(x.id)),
      Language: (id) => entities.languages.find(x => id.eq(x.id)),
      MusicGenre: (id) => entities.musicGenres.find(x => id.eq(x.id)),
      MusicMood: (id) => entities.musicMoods.find(x => id.eq(x.id)),
      MusicTheme: (id) => entities.musicThemes.find(x => id.eq(x.id)),
      PublicationStatus: (id) => entities.publicationStatuses.find(x => id.eq(x.id)),
      VideoCategory: (id) => entities.videoCategories.find(x => id.eq(x.id))
    }
  }

  async dropdownOptions(): Promise<MediaDropdownOptions> {
    const res = new MediaDropdownOptions(
      await this.allInternalEntities()
    )
    //console.log('Transport.dropdownOptions', res)
    return res
  }
}
