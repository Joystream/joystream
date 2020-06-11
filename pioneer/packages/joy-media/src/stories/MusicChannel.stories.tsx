import React from 'react';
import '../common/index.css';

import { MockMusicChannel } from './data/ChannelSamples';
import { ViewMusicChannel } from '../channels/ViewMusicChannel';
import { MusicAlbumSamples } from './data/MusicAlbumSamples';
import { AllMusicTrackSamples } from './data/MusicTrackSamples';
import { withMockTransport } from './withMockTransport';

export default {
  title: 'Media | Music channel',
  decorators: [withMockTransport]
};

export const EmptyMusicChannel = () =>
  <ViewMusicChannel channel={MockMusicChannel} />;

export const MusicChannelWithAlbumsOnly = () =>
  <ViewMusicChannel channel={MockMusicChannel} albums={MusicAlbumSamples} />;

export const MusicChannelWithAlbumAndTracks = () =>
  <ViewMusicChannel
    channel={MockMusicChannel}
    albums={MusicAlbumSamples}
    tracks={AllMusicTrackSamples}
  />;
