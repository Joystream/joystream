import BN from 'bn.js';
import { MediaTransport, EntityCodecByClassNameMap, ClassName } from './transport';
import { ClassId, Class, EntityId, Entity } from '@joystream/types/versioned-store';
import { PlainEntity, AnyEntityCodec } from '@joystream/types/versioned-store/EntityCodec';
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
import { ChannelEntity } from './entities/ChannelEntity';
import { ChannelId, Channel } from '@joystream/types/content-working-group';
import { ApiPromise } from '@polkadot/api/index';
import { ApiProps } from '@polkadot/react-api/types';
import { Vec } from '@polkadot/types';
import { LinkageResult } from '@polkadot/types/codec/Linkage';
import { ChannelCodec } from './schemas/channel/Channel';

const FIRST_CHANNEL_ID = 0;
const FIRST_CLASS_ID = 1;
const FIRST_ENTITY_ID = 1;

export class SubstrateTransport extends MediaTransport {

  protected api: ApiPromise

  constructor(api: ApiProps) {
    super();
    
    if (!api) {
      throw new Error('Cannot create SubstrateTransport: Substrate API is required');
    } else if (!api.isApiReady) {
      throw new Error('Cannot create SubstrateTransport: Substrate API is not ready yet');
    }

    this.api = api.api;
  }

  protected notImplementedYet<T> (): T {
    throw new Error('Substrate transport: Requested function is not implemented yet')
  }

  /** Content Working Group query. */
  cwgQuery() {
    return this.api.query.contentWorkingGroup
  }

  /** Versioned Store query. */
  vsQuery() {
    return this.api.query.versionedStore
  }

  // Channels (Content Working Group module)
  // -----------------------------------------------------------------

  async nextChannelId(): Promise<ChannelId> {
    return await this.cwgQuery().nextChannelId<ChannelId>()
  }

  async allChannelIds(): Promise<ChannelId[]> {
    let nextId = (await this.nextChannelId()).toNumber()
    if (nextId < 1) nextId = 1

    const allIds: ChannelId[] = []
    for (let id = FIRST_CHANNEL_ID; id < nextId; id++) {
      allIds.push(new ChannelId(id))
    }

    return allIds
  }

  async allChannels(): Promise<ChannelEntity[]> {
    const ids = await this.allChannelIds()
    const channelTuples = await this.cwgQuery().channelById.multi<LinkageResult>(ids)

    return channelTuples.map((tuple, i) => {
      const channel = tuple[0] as Channel
      const plain = ChannelCodec.fromSubstrate(ids[i], channel)
      
      return {
        ...plain,
        rewardEarned: new BN(0), // TODO calc this value based on chain data
        contentItemsCount: 0,    // TODO calc this value based on chain data
      }
    })
  }

  // Classes (Versioned Store module)
  // -----------------------------------------------------------------

  async nextClassId(): Promise<ClassId> {
    return await this.vsQuery().nextClassId<ClassId>()
  }

  async allClassIds(): Promise<ClassId[]> {
    let nextId = (await this.nextClassId()).toNumber()

    const allIds: ClassId[] = []
    for (let id = FIRST_CLASS_ID; id < nextId; id++) {
      allIds.push(new ClassId(id))
    }

    return allIds
  }

  // TODO Think wisely how to optimize/memoize the result of this func
  async allClasses(): Promise<Class[]> {
    const ids = await this.allClassIds()
    return await this.vsQuery().classById.multi<Vec<Class>>(ids) as unknown as Class[]
  }

  // Entities (Versioned Store module)
  // -----------------------------------------------------------------

  async nextEntityId(): Promise<EntityId> {
    return await this.vsQuery().nextEntityId<EntityId>()
  }

  async allEntityIds(): Promise<EntityId[]> {
    let nextId = (await this.nextEntityId()).toNumber()

    const allIds: EntityId[] = []
    for (let id = FIRST_ENTITY_ID; id < nextId; id++) {
      allIds.push(new EntityId(id))
    }

    return allIds
  }

  // TODO Think wisely how to optimize/memoize the result of this func
  async allEntities(): Promise<Entity[]> {
    const ids = await this.allEntityIds()
    return await this.vsQuery().entityById.multi<Vec<Entity>>(ids) as unknown as Entity[]
  }

  async allEntitiesByClassName(className: ClassName): Promise<Entity[]> {
    const classId = (await this.classIdByNameMap())[className]

    if (!classId) {
      console.log(`No entities found by class name '${className}'`)
      return []
    }

    return (await this.allEntities())
      .filter((e) => classId.eq(e.class_id))
  }

  async findPlainEntitiesByClassName<T extends PlainEntity> (className: ClassName): Promise<T[]> {
    const entities = await this.allEntitiesByClassName(className)

    const klass = await this.classByName(className)
    if (!klass) {
      console.log(`No class found by name '${className}'`)
      return []
    }
    
    const CodecClass = EntityCodecByClassNameMap[className] as typeof AnyEntityCodec
    if (!CodecClass) {
      console.log(`Entity codec not found by class name '${className}'`)
      return []
    }

    return (new CodecClass(klass)).toPlainObjects(entities)
  }

  async allVideos(): Promise<VideoType[]> {
    return await this.findPlainEntitiesByClassName('Video')
  }

  async featuredVideos(): Promise<VideoType[]> {
    return this.notImplementedYet(); // TODO impl
  }

  async musicTrackClass(): Promise<Class> {
    return this.notImplementedYet(); // TODO impl
  }

  async musicAlbumClass(): Promise<Class> {
    return this.notImplementedYet(); // TODO impl
  }

  async videoClass(): Promise<Class> {
    return this.notImplementedYet(); // TODO impl
  }

  async musicTrackById (_id: EntityId): Promise<MusicTrackType> {
    return this.notImplementedYet(); // TODO impl
  }

  async musicAlbumById (_id: EntityId): Promise<MusicAlbumType> {
    return this.notImplementedYet(); // TODO impl
  }

  async allMediaObjects(): Promise<MediaObjectType[]> {
    return this.notImplementedYet(); // TODO impl: get from data storafe module (Substrate)
  }

  async allContentLicenses (): Promise<ContentLicenseType[]> {
    return await this.findPlainEntitiesByClassName('ContentLicense')
  }

  async allCurationStatuses(): Promise<CurationStatusType[]> {
    return await this.findPlainEntitiesByClassName('CurationStatus')
  }

  async allLanguages(): Promise<LanguageType[]> {
    return await this.findPlainEntitiesByClassName('Language')
  }

  async allMusicGenres(): Promise<MusicGenreType[]> {
    return await this.findPlainEntitiesByClassName('MusicGenre')
  }

  async allMusicMoods(): Promise<MusicMoodType[]> {
    return await this.findPlainEntitiesByClassName('MusicMood')
  }

  async allMusicThemes(): Promise<MusicThemeType[]> {
    return await this.findPlainEntitiesByClassName('MusicTheme')
  }

  async allPublicationStatuses(): Promise<PublicationStatusType[]> {
    return await this.findPlainEntitiesByClassName('PublicationStatus')
  }

  async allVideoCategories(): Promise<VideoCategoryType[]> {
    return await this.findPlainEntitiesByClassName('VideoCategory')
  }
}
