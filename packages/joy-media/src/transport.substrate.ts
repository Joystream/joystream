import BN from 'bn.js';
import { camelCase, upperFirst } from 'lodash'
import { MediaTransport } from './transport';
import { ClassId, Class, EntityId, Entity } from '@joystream/types/versioned-store';
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
import { MockTransport } from './transport.mock';

// TODO Delete this mock, when all methods here will be implemented using Substrate
const mock = new MockTransport();

const FIRST_CHANNEL_ID = 0;
const FIRST_CLASS_ID = 1;
const FIRST_ENTITY_ID = 1;

interface ClassIdByNameMap {
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

type ClassName = keyof ClassIdByNameMap

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

  async allClasses(): Promise<Class[]> {
    const ids = await this.allClassIds()
    return await this.vsQuery().classById.multi<Vec<Class>>(ids) as unknown as Class[]
  }

  // TODO Save result of this func in context state and subscribe to updates from Substrate.
  async classIdByNameMap(): Promise<ClassIdByNameMap> {
    const map: ClassIdByNameMap = {}
    const classes = await this.allClasses()
    classes.forEach((x) => {
      const className = upperFirst(camelCase(x.name)) as ClassName
      map[className] = x.id
    });
    return map
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

  async allVideos(): Promise<VideoType[]> {
    return this.notImplementedYet(); // TODO impl
  }

  featuredVideos(): Promise<VideoType[]> {
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

  allMediaObjects(): Promise<MediaObjectType[]> {
    return this.notImplementedYet(); // TODO impl
  }

  allContentLicenses (): Promise<ContentLicenseType[]> {
    // TODO impl Substrate version:
    return mock.allContentLicenses();
  }

  allCurationStatuses(): Promise<CurationStatusType[]> {
    // TODO impl Substrate version:
    return mock.allCurationStatuses();
  }

  allLanguages(): Promise<LanguageType[]> {
    // TODO impl Substrate version:
    return mock.allLanguages();
  }

  allMusicGenres(): Promise<MusicGenreType[]> {
    // TODO impl Substrate version:
    return mock.allMusicGenres();
  }

  allMusicMoods(): Promise<MusicMoodType[]> {
    // TODO impl Substrate version:
    return mock.allMusicMoods();
  }

  allMusicThemes(): Promise<MusicThemeType[]> {
    // TODO impl Substrate version:
    return mock.allMusicThemes();
  }

  allPublicationStatuses(): Promise<PublicationStatusType[]> {
    // TODO impl Substrate version:
    return mock.allPublicationStatuses();
  }

  allVideoCategories(): Promise<VideoCategoryType[]> {
    // TODO impl Substrate version:
    return mock.allVideoCategories();
  }
}
