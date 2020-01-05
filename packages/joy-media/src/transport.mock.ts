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

export class MockTransport extends TransportBase implements ITransport {

  musicTrackById (_id: EntityId): Promise<MusicTrackType> {
    return this.promise<MusicTrackType>(
      {
        title: 'Requiem (Mozart)',
        artist: 'Berlin Philharmonic',
        thumbnail: 'https://assets.classicfm.com/2017/36/mozart-1504532179-list-handheld-0.jpg',
        description: 'The Requiem in D minor, K. 626, is a requiem mass by Wolfgang Amadeus Mozart (1756–1791). Mozart composed part of the Requiem in Vienna in late 1791, but it was unfinished at his death on 5 December the same year. A completed version dated 1792 by Franz Xaver Süssmayr was delivered to Count Franz von Walsegg, who commissioned the piece for a Requiem service to commemorate the anniversary of his wifes death on 14 February.',
        language: undefined,
        firstReleased: 567425967, // 1987 year.
        genre: 'Classical Music',
        mood: 'Relaxing',
        theme: 'Light',
        link: [],
        composerOrSongwriter: 'Mozart',
        lyrics: undefined,
        object: undefined,
        publicationStatus: 'Public', // TODO replace w/ const
        curationStatus: undefined, // TODO replace w/ const
        explicit: false,
        license: 'Public Domain', // TODO replace w/ const
        attribution: undefined
      }
    )
  }

  musicAlbumById (_id: EntityId): Promise<MusicAlbumType> {
    return this.promise<MusicAlbumType>(
      {
        title: 'Riddle',
        artist: 'Liquid Stone',
        thumbnail: 'https://images.unsplash.com/photo-1484352491158-830ef5692bb3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        description: 'Building material is any material which is used for construction purposes. Many naturally occurring substances, such as clay, rocks, sand, and wood, even twigs and leaves, have been used to construct buildings.\n\nApart from naturally occurring materials, many man-made products are in use, some more and some less synthetic.',
        firstReleased: 567425123, // 1987 year.
        genre: 'Metal',
        mood: 'Determined',
        theme: 'Dark',
        tracks: [],
        language: 'DE',
        link: [],
        lyrics: undefined,
        composerOrSongwriter: 'Massive Sand',
        reviews: [],
        publicationStatus: 'Unlisted',
        curationStatus: undefined, // TODO replace w/ const
        explicit: false,
        license: 'No Commercial',
        attribution: undefined
      }
    )
  }

  videoById (_id: EntityId): Promise<VideoType> {
    return this.promise<VideoType>(
      {
        title: 'Лесные приключения букашки',
        thumbnail: 'https://images.unsplash.com/photo-1526749837599-b4eba9fd855e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=200&q=60',
        description: 'Путеше́ствие — передвижение по какой-либо территории или акватории с целью их изучения, а также с общеобразовательными, познавательными, спортивными и другими целями.\n\nДо XIX века путешествия были одним из основных источников получения сведений о тех или иных странах (их природе, населении, истории, хозяйстве), общем характере и очертании поверхности Земли.',
        language: 'RU',
        firstReleased: 567425543, // 1987 year.
        category: 'Travel & Events',
        link: [],
        object: undefined,
        publicationStatus: 'Unlisted',
        curationStatus: undefined,
        explicit: true,
        license: 'Share Alike',
        attribution: undefined
      }
    )
  }

  channelById (_id: ChannelId): Promise<ChannelType> {
    return this.promise<ChannelType>(
      {
        content: 'Music Channel',
        channelName: 'top_notes',
        thumbnail: 'https://images.unsplash.com/photo-1485561222814-e6c50477491b?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=200&q=60',
        cover: 'https://images.unsplash.com/photo-1514119412350-e174d90d280e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=900&q=80',
        description: 'Music is an art form and cultural activity whose medium is sound organized in time. General definitions of music include common elements such as pitch (which governs melody and harmony), rhythm (and its associated concepts tempo, meter, and articulation), dynamics (loudness and softness), and the sonic qualities of timbre and texture (which are sometimes termed the "color" of a musical sound).',
        publicationStatus: 'Unlisted',
        curationStatus: undefined // TODO replace w/ const
      }
    )
  }

  allEntities (): Subscribable<Entity[]> {
    return new Observable<Entity[]>(observer => {
      observer.next(
        [] // TODO create mock data
      );
    });
  }
}
