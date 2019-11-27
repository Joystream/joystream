import React from 'react';
import '../common/index.css';

import { withKnobs } from '@storybook/addon-knobs';
import { EditMusicAlbum } from '../music/EditMusicAlbum';
import { MyMusicTracks } from '../music/MyMusicTracks';
import { MusicAlbumSamples } from './data/MusicAlbumSamples';
import { MusicAlbumExample, albumTracks, MusicTrackSamples } from './data/MusicTrackSamples';

export default { 
    title: 'Media | My music tracks',
    decorators: [withKnobs],
};

export const EditAlbumStory = () =>
	<EditMusicAlbum
		isStorybook={true} 
		entity={MusicAlbumExample}
		tracks={albumTracks}
	/>

export const MyMusicTracksStory = () =>
	<MyMusicTracks
		albums={MusicAlbumSamples}
		tracks={MusicTrackSamples}
	/>

// export const DefaultState = () => {
// 	return <TracksOfMyMusicAlbum album={MusicAlbumSample} />;
// }

// export const AlbumWithTracks = () => {
// 	return <TracksOfMyMusicAlbum {...AlbumWithTracksProps} />
// }

// export const ReorderTracks = () =>
// 	<ReorderableTracks {...AlbumWithTracksProps} />

// export const EditAlbumModalStory = () =>
// 	<EditAlbumModal {...AlbumWithTracksProps} />
