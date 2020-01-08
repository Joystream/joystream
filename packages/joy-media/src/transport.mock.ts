import { Observable } from 'rxjs';

import { ITransport } from './transport'
import { Transport as TransportBase, Subscribable } from '@polkadot/joy-utils/index'

import EntityId from '@joystream/types/versioned-store/EntityId';
import { Entity } from '@joystream/types/versioned-store';
import { MusicTrackType } from './schemas/music/MusicTrack';
import { MusicAlbumType } from './schemas/music/MusicAlbum';
import { VideoType } from './schemas/video/Video';
import { ChannelType } from './schemas/channel/Channel';
import { ChannelId } from './channels/ChannelId';

import * as mocks from './mocks';

export class MockTransport extends TransportBase implements ITransport {

  musicTrackById (_id: EntityId): Promise<MusicTrackType> {
    return this.promise(mocks.MusicTrack);
  }

  musicAlbumById (_id: EntityId): Promise<MusicAlbumType> {
    return this.promise(mocks.MusicAlbum);
  }

  videoById (_id: EntityId): Promise<VideoType> {
    return this.promise(mocks.Video);
  }

  channelById (_id: ChannelId): Promise<ChannelType> {
    return this.promise(mocks.Channel);
  }

  allEntities (): Subscribable<Entity[]> {
    return new Observable<Entity[]>(observer => {
      observer.next(
        [] // TODO create mock data
      );
    });
  }
}
