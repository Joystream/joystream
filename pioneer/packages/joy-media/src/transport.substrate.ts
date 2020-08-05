import BN from 'bn.js';
import { MediaTransport, ChannelValidationConstraints } from './transport';
import { ClassId, Class, EntityId, Entity, ClassName } from '@joystream/types/versioned-store';
import { InputValidationLengthConstraint } from '@joystream/types/common';
import { PlainEntity, EntityCodecResolver } from '@joystream/types/versioned-store/EntityCodec';
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
import { FeaturedContentType } from './schemas/general/FeaturedContent';
import { AnyChannelId, asChannelId, AnyClassId, AnyEntityId } from './common/TypeHelpers';
import { SimpleCache } from '@polkadot/joy-utils/SimpleCache';
import { ValidationConstraint } from '@polkadot/joy-utils/ValidationConstraint';

const FIRST_CHANNEL_ID = 1;
const FIRST_CLASS_ID = 1;
const FIRST_ENTITY_ID = 1;

/**
 * There are entities that refer to other entities.
 */
const ClassNamesThatRequireLoadingInternals: ClassName[] = [
  'Video',
  'MusicTrack',
  'MusicAlbum'
];

/**
 * There are such group of entities that are safe to cache
 * becase they serve as utility entities.
 * Very unlikely that their values will be changed frequently.
 * Even if changed, this is not a big issue from UI point of view.
 */
const ClassNamesThatCanBeCached: ClassName[] = [
  'ContentLicense',
  'CurationStatus',
  'Language',
  'MusicGenre',
  'MusicMood',
  'MusicTheme',
  'PublicationStatus',
  'VideoCategory'
];

export class SubstrateTransport extends MediaTransport {
  protected api: ApiPromise

  private entityCodecResolver: EntityCodecResolver | undefined

  private channelCache: SimpleCache<ChannelId, ChannelEntity>
  private entityCache: SimpleCache<EntityId, PlainEntity>
  private classCache: SimpleCache<ClassId, Class>

  // Ids of such entities as Language, Video Category, Music Mood, etc
  // will be pushed to this array later in this transport class.
  private idsOfEntitiesToKeepInCache: Set<string> = new Set()

  constructor (api: ApiProps) {
    super();
    console.log('Create new SubstrateTransport');

    if (!api) {
      throw new Error('Cannot create SubstrateTransport: Substrate API is required');
    } else if (!api.isApiReady) {
      throw new Error('Cannot create SubstrateTransport: Substrate API is not ready yet');
    }

    this.api = api.api;

    const loadChannelsByIds = this.loadChannelsByIds.bind(this);
    const loadEntitiesByIds = this.loadPlainEntitiesByIds.bind(this);
    const loadClassesByIds = this.loadClassesByIds.bind(this);

    this.channelCache = new SimpleCache('Channel Cache', loadChannelsByIds);
    this.entityCache = new SimpleCache('Entity Cache', loadEntitiesByIds);
    this.classCache = new SimpleCache('Class Cache', loadClassesByIds);
  }

  protected notImplementedYet<T> (): T {
    throw new Error('Substrate transport: Requested function is not implemented yet');
  }

  /** Content Working Group query. */
  cwgQuery () {
    return this.api.query.contentWorkingGroup;
  }

  /** Versioned Store query. */
  vsQuery () {
    return this.api.query.versionedStore;
  }

  clearSessionCache () {
    console.info('Clear cache of Substrate Transport');
    this.channelCache.clear();

    this.entityCache.clearExcept(
      this.idsOfEntitiesToKeepInCache
    );

    // Don't clean Class cache. It's safe to preserve it between transport sessions.
    // this.classCache.clear()
  }

  // Channels (Content Working Group module)
  // -----------------------------------------------------------------

  async nextChannelId (): Promise<ChannelId> {
    return await this.cwgQuery().nextChannelId<ChannelId>();
  }

  async allChannelIds (): Promise<ChannelId[]> {
    let nextId = (await this.nextChannelId()).toNumber();
    if (nextId < 1) nextId = 1;

    const allIds: ChannelId[] = [];
    for (let id = FIRST_CHANNEL_ID; id < nextId; id++) {
      allIds.push(new ChannelId(id));
    }

    return allIds;
  }

  async loadChannelsByIds (ids: AnyChannelId[]): Promise<ChannelEntity[]> {
    const channelTuples = await this.cwgQuery().channelById.multi<LinkageResult>(ids);

    return channelTuples.map((tuple, i) => {
      const channel = tuple[0] as Channel;
      const id = asChannelId(ids[i]);
      const plain = ChannelCodec.fromSubstrate(id, channel);

      return {
        ...plain,
        rewardEarned: new BN(0), // TODO calc this value based on chain data
        contentItemsCount: 0 // TODO calc this value based on chain data
      };
    });
  }

  async allChannels (): Promise<ChannelEntity[]> {
    const ids = await this.allChannelIds();
    return await this.channelCache.getOrLoadByIds(ids);
  }

  protected async getValidationConstraint (constraintName: string): Promise<ValidationConstraint> {
    const constraint = await this.cwgQuery()[constraintName]<InputValidationLengthConstraint>();
    return {
      min: constraint.min.toNumber(),
      max: constraint.max.toNumber()
    };
  }

  async channelValidationConstraints (): Promise<ChannelValidationConstraints> {
    const [
      handle,
      title,
      description,
      avatar,
      banner
    ] = await Promise.all([
      this.getValidationConstraint('channelHandleConstraint'),
      this.getValidationConstraint('channelTitleConstraint'),
      this.getValidationConstraint('channelDescriptionConstraint'),
      this.getValidationConstraint('channelAvatarConstraint'),
      this.getValidationConstraint('channelBannerConstraint')
    ]);
    return {
      handle,
      title,
      description,
      avatar,
      banner
    };
  }

  // Classes (Versioned Store module)
  // -----------------------------------------------------------------

  async nextClassId (): Promise<ClassId> {
    return await this.vsQuery().nextClassId<ClassId>();
  }

  async allClassIds (): Promise<ClassId[]> {
    const nextId = (await this.nextClassId()).toNumber();

    const allIds: ClassId[] = [];
    for (let id = FIRST_CLASS_ID; id < nextId; id++) {
      allIds.push(new ClassId(id));
    }

    return allIds;
  }

  async loadClassesByIds (ids: AnyClassId[]): Promise<Class[]> {
    return await this.vsQuery().classById.multi<Vec<Class>>(ids) as unknown as Class[];
  }

  async allClasses (): Promise<Class[]> {
    const ids = await this.allClassIds();
    return await this.classCache.getOrLoadByIds(ids);
  }

  async getEntityCodecResolver (): Promise<EntityCodecResolver> {
    if (!this.entityCodecResolver) {
      const classes = await this.allClasses();
      this.entityCodecResolver = new EntityCodecResolver(classes);
    }
    return this.entityCodecResolver;
  }

  async classNamesToIdSet (classNames: ClassName[]): Promise<Set<string>> {
    const classNameToIdMap = await this.classIdByNameMap();
    return new Set(classNames
      .map(name => {
        const classId = classNameToIdMap[name];
        return classId ? classId.toString() : undefined;
      })
      .filter(classId => typeof classId !== 'undefined') as string[]
    );
  }

  // Entities (Versioned Store module)
  // -----------------------------------------------------------------

  async nextEntityId (): Promise<EntityId> {
    return await this.vsQuery().nextEntityId<EntityId>();
  }

  async allEntityIds (): Promise<EntityId[]> {
    const nextId = (await this.nextEntityId()).toNumber();

    const allIds: EntityId[] = [];
    for (let id = FIRST_ENTITY_ID; id < nextId; id++) {
      allIds.push(new EntityId(id));
    }

    return allIds;
  }

  private async loadEntitiesByIds (ids: AnyEntityId[]): Promise<Entity[]> {
    if (!ids || ids.length === 0) return [];

    return await this.vsQuery().entityById.multi<Vec<Entity>>(ids) as unknown as Entity[];
  }

  // TODO try to cache this func
  private async loadPlainEntitiesByIds (ids: AnyEntityId[]): Promise<PlainEntity[]> {
    const entities = await this.loadEntitiesByIds(ids);
    const cacheClassIds = await this.classNamesToIdSet(ClassNamesThatCanBeCached);
    entities.forEach(e => {
      if (cacheClassIds.has(e.class_id.toString())) {
        this.idsOfEntitiesToKeepInCache.add(e.id.toString());
      }
    });

    // Next logs are usefull for debug:
    // console.log('cacheClassIds', cacheClassIds)
    // console.log('idsOfEntitiesToKeepInCache', this.idsOfEntitiesToKeepInCache)

    return await this.toPlainEntitiesAndResolveInternals(entities);
  }

  async allPlainEntities (): Promise<PlainEntity[]> {
    const ids = await this.allEntityIds();
    return await this.entityCache.getOrLoadByIds(ids);
  }

  async findPlainEntitiesByClassName<T extends PlainEntity> (className: ClassName): Promise<T[]> {
    const res: T[] = [];
    const clazz = await this.classByName(className);
    if (!clazz) {
      console.warn(`No class found by name '${className}'`);
      return res;
    }

    const allIds = await this.allEntityIds();
    const filteredEntities = (await this.entityCache.getOrLoadByIds(allIds))
      .filter(entity => clazz.id.eq(entity.classId)) as T[];

    console.log(`Found ${filteredEntities.length} plain entities by class name '${className}'`);

    return filteredEntities;
  }

  async toPlainEntitiesAndResolveInternals (entities: Entity[]): Promise<PlainEntity[]> {
    const loadEntityById = this.entityCache.getOrLoadById.bind(this.entityCache);
    const loadChannelById = this.channelCache.getOrLoadById.bind(this.channelCache);

    const entityCodecResolver = await this.getEntityCodecResolver();
    const loadableClassIds = await this.classNamesToIdSet(ClassNamesThatRequireLoadingInternals);

    const converted: PlainEntity[] = [];
    for (const entity of entities) {
      const classIdStr = entity.class_id.toString();
      const codec = entityCodecResolver.getCodecByClassId(entity.class_id);

      if (!codec) {
        console.warn(`No entity codec found by class id: ${classIdStr}`);
        continue;
      }

      const loadInternals = loadableClassIds.has(classIdStr);

      try {
        converted.push(await codec.toPlainObject(
          entity, {
            loadInternals,
            loadEntityById,
            loadChannelById
          })
        );
      } catch (conversionError) {
        console.error(conversionError);
      }
    }

    return converted;
  }

  // Load entities by class name:
  // -----------------------------------------------------------------

  async featuredContent (): Promise<FeaturedContentType | undefined> {
    const arr = await this.findPlainEntitiesByClassName('FeaturedContent');
    return arr && arr.length ? arr[0] : undefined;
  }

  async allMediaObjects (): Promise<MediaObjectType[]> {
    return await this.findPlainEntitiesByClassName('MediaObject');
  }

  async allVideos (): Promise<VideoType[]> {
    return await this.findPlainEntitiesByClassName('Video');
  }

  async allMusicTracks (): Promise<MusicTrackType[]> {
    return await this.findPlainEntitiesByClassName('MusicTrack');
  }

  async allMusicAlbums (): Promise<MusicAlbumType[]> {
    return await this.findPlainEntitiesByClassName('MusicAlbum');
  }

  async allContentLicenses (): Promise<ContentLicenseType[]> {
    return await this.findPlainEntitiesByClassName('ContentLicense');
  }

  async allCurationStatuses (): Promise<CurationStatusType[]> {
    return await this.findPlainEntitiesByClassName('CurationStatus');
  }

  async allLanguages (): Promise<LanguageType[]> {
    return await this.findPlainEntitiesByClassName('Language');
  }

  async allMusicGenres (): Promise<MusicGenreType[]> {
    return await this.findPlainEntitiesByClassName('MusicGenre');
  }

  async allMusicMoods (): Promise<MusicMoodType[]> {
    return await this.findPlainEntitiesByClassName('MusicMood');
  }

  async allMusicThemes (): Promise<MusicThemeType[]> {
    return await this.findPlainEntitiesByClassName('MusicTheme');
  }

  async allPublicationStatuses (): Promise<PublicationStatusType[]> {
    return await this.findPlainEntitiesByClassName('PublicationStatus');
  }

  async allVideoCategories (): Promise<VideoCategoryType[]> {
    return await this.findPlainEntitiesByClassName('VideoCategory');
  }
}
