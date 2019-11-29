import React from 'react';
import '../common/index.css';

import { withKnobs } from '@storybook/addon-knobs';
import { ExploreContent } from '../explore/ExploreContent';
import { MusicAlbumSamples } from './data/MusicAlbumSamples';

export default { 
    title: 'Media | Explore',
    decorators: [withKnobs],
};

export const DefaultState = () =>
	<ExploreContent />

export const FeaturedAndLatestAlbums = () =>
	<ExploreContent 
		featuredAlbums={MusicAlbumSamples.slice(0, 3)}
		latestAlbums={MusicAlbumSamples.reverse()}
	/>
