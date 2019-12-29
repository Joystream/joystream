import React from 'react';
import '../common/index.css';

import { EditForm } from '../music/EditMusicAlbum';
import { MyMusicTracks } from '../music/MyMusicTracks';
import { MusicAlbumSamples } from './data/MusicAlbumSamples';
import { MusicAlbumExample, albumTracks, AllMusicTrackSamples } from './data/MusicTrackSamples';
import { withMockTransport } from './withMockTransport';
import { EditMusicAlbumView } from '../music/EditMusicAlbum.view';
import EntityId from '@joystream/types/versioned-store/EntityId';

export default { 
    title: 'Media | My music tracks',
    decorators: [ withMockTransport ],
};

export const DefaultState = () =>
	<EditForm
		isStorybook={true} 
	/>

export const MockEditAlbumView = () =>
	<EditMusicAlbumView
		isStorybook={true}
		id={new EntityId(1)}
		tracks={albumTracks}
	/>

export const MyMusicTracksStory = () =>
	<MyMusicTracks
		albums={MusicAlbumSamples}
		tracks={AllMusicTrackSamples}
	/>
