import { Observable } from 'rxjs';

import { ITransport } from './transport'
import { Transport as TransportBase, Subscribable } from '@polkadot/joy-utils/index'

import EntityId from '@joystream/types/versioned-store/EntityId';
import { Entity } from '@joystream/types/versioned-store';
import { MusicTrackType } from './schemas/music/MusicTrack';
import { MusicAlbumType } from './schemas/music/MusicAlbum';
import { VideoType } from './schemas/video/Video';
import { ChannelId } from './channels/ChannelId';
import { ChannelType } from './channels/ChannelFormTypes';

export class SubstrateTransport extends TransportBase implements ITransport {

  musicTrackById (_id: EntityId): Promise<MusicTrackType> {
    return this.promise<MusicTrackType>(
      {} as MusicTrackType // TODO impl
    )
  }

  musicAlbumById (_id: EntityId): Promise<MusicAlbumType> {
    return this.promise<MusicAlbumType>(
      {} as MusicAlbumType // TODO impl
    )
  }

  videoById (_id: EntityId): Promise<VideoType> {
    return this.promise<VideoType>(
      {} as VideoType // TODO impl
    )
  }

  channelById (_id: ChannelId): Promise<ChannelType> {
    return this.promise<ChannelType>(
      {} as ChannelType // TODO impl
    )
  }

  allEntities (): Subscribable<Entity[]> {
    return new Observable<Entity[]>(observer => {
      observer.next(
        [] // TODO impl
      );
    });
  }
}
