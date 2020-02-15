import BN from 'bn.js';
import { MediaTransport } from './transport';
import { Subscribable } from '@polkadot/joy-utils/Subscribable';
import EntityId from '@joystream/types/versioned-store/EntityId';
import { Entity, Class } from '@joystream/types/versioned-store';
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
import { LinkageResult } from '@polkadot/types/codec/Linkage';
import { ChannelCodec } from './schemas/channel/Channel';
import { MockTransport } from './transport.mock';

// TODO Delete this mock, when all methods here will be implemented using Substrate
const mock = new MockTransport();

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

  cwgQuery() {
    return this.api.query.contentWorkingGroup
  }

  async nextChannelId(): Promise<ChannelId> {
    return await this.cwgQuery().nextChannelId<ChannelId>()
  }

  async allChannelIds(): Promise<ChannelId[]> {
    let nextId = (await this.nextChannelId()).toNumber()
    if (nextId < 1) nextId = 1

    const allIds: ChannelId[] = []
    for (let id = 0; id < nextId; id++) {
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

  allVideos(): Promise<VideoType[]> {
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

  allEntities (): Subscribable<Entity[]> {
    return this.notImplementedYet(); // TODO impl
  }
}
