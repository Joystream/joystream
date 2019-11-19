import React from 'react';
import '../music/index.css';

import { withKnobs } from '@storybook/addon-knobs';
import { MyMusicAlbums } from '../music/MyMusicAlbums';
import { FewMusicAlbums } from '../music/StorybookUtils';

export default { 
    title: 'Media | My music albums',
    decorators: [withKnobs],
};

export const DefaultState = () => {
	return <MyMusicAlbums />;
}

export const WithState = () => {
	return <MyMusicAlbums albums={FewMusicAlbums} />;
}
