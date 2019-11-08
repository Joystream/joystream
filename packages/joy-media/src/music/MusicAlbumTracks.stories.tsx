import React from 'react';
import './index.css';

import { withKnobs } from '@storybook/addon-knobs';
import { TracksOfMyMusicAlbum } from './MusicAlbumTracks';
import { AlbumExample } from './StorybookUtils';

export default { 
    title: 'Media | Tracks of my music album',
    decorators: [withKnobs],
};

export const DefaultState = () => {
	return <TracksOfMyMusicAlbum album={AlbumExample} />;
}

export const AlbumWithTracks = () => {
	return <TracksOfMyMusicAlbum 
		album={AlbumExample}
		tracks={albumTracks} 
	/>;
}

const trackNames = [
	'Arborvitae (Thuja occidentalis)',
	'Black Ash (Fraxinus nigra)',
	'White Ash (Fraxinus americana)',
	'Bigtooth Aspen (Populus grandidentata)',
	'Quaking Aspen (Populus tremuloides)',
	'Basswood (Tilia americana)',
	'American Beech (Fagus grandifolia)',
	'Black Birch (Betula lenta)',
	'Gray Birch (Betula populifolia)',
	'Paper Birch (Betula papyrifera)',
	'Yellow Birch (Betula alleghaniensis)',
	'Butternut (Juglans cinerea)',
	'Black Cherry (Prunus serotina)',
	'Pin Cherry (Prunus pensylvanica)'
]

const albumTracks = trackNames.map(title => ({
	title,
	artist: 'Man from the Woods',
	cover: 'https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=60'
}));
