import React from 'react';
import '../common/index.css';

import { PlayContent } from '../explore/PlayContent';
import { PlayVideo } from '../video/PlayVideo';
import { FeaturedAlbums } from './data/MusicAlbumSamples';
import { Album1TrackSamples } from './data/MusicTrackSamples';
import { MockMusicChannel, MockVideoChannel } from './data/ChannelSamples';
import { withMockTransport } from './withMockTransport';
import { Video } from '../mocks';
import { EntityId } from '@joystream/types/versioned-store';

export default {
  title: 'Media | Playback',
  decorators: [withMockTransport]
};

export const PlayVideoStory = () =>
  <PlayVideo
    id={new EntityId(Video.id)}
    video={Video}
    channel={MockVideoChannel}
  />;

export const PlayAlbumStory = () =>
  <PlayContent
    channel={MockMusicChannel}
    featuredAlbums={FeaturedAlbums}
    tracks={Album1TrackSamples}
    currentTrackIndex={3}
  />;
