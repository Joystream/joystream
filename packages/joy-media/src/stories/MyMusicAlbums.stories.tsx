import React from 'react';
import '../common/index.css';

import { MyMusicAlbums } from '../music/MyMusicAlbums';
import { MusicAlbumSamples } from './data/MusicAlbumSamples';
import { withMockTransport } from './withMockTransport';

export default { 
    title: 'Media | My music albums',
    decorators: [ withMockTransport ],
};

export const DefaultState = () => {
	return <MyMusicAlbums />;
}

export const WithState = () => {
	return <MyMusicAlbums albums={MusicAlbumSamples} />;
}
