import React from 'react';
import '../common/index.scss';

import { EditForm } from '../music/EditMusicAlbum';
import { MyMusicTracks } from '../music/MyMusicTracks';
import { MusicAlbumSamples } from './data/MusicAlbumSamples';
import { albumTracks, AllMusicTrackSamples } from './data/MusicTrackSamples';
import { withMockTransport } from './withMockTransport';
import { EditMusicAlbumView } from '../music/EditMusicAlbum.view';
import { createType } from '@joystream/types';

export default {
  title: 'Media | My music tracks',
  decorators: [withMockTransport]
};

export const DefaultState = () =>
  <EditForm />;

export const MockEditAlbumView = () =>
  <EditMusicAlbumView
    id={createType('EntityId', 1)}
    tracks={albumTracks}
  />;

export const MyMusicTracksStory = () =>
  <MyMusicTracks
    albums={MusicAlbumSamples}
    tracks={AllMusicTrackSamples}
  />;
