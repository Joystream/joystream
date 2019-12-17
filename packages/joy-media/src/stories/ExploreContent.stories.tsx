import React from 'react';
import '../common/index.css';

import { withKnobs } from '@storybook/addon-knobs';
import { ExploreContent } from '../explore/ExploreContent';
import { MusicAlbumSamples } from './data/MusicAlbumSamples';
import { PlayContent } from '../explore/PlayContent';
import { Album1TrackSamples } from './data/MusicTrackSamples';
import { ChannelDataSample } from './data/ChannelSamples';

export default { 
    title: 'Media | Explore',
    decorators: [withKnobs],
};

const FeaturedAlbums = MusicAlbumSamples.slice(0, 3);

export const DefaultState = () =>
	<ExploreContent />

export const FeaturedAndLatestAlbums = () =>
	<ExploreContent 
		featuredAlbums={FeaturedAlbums}
		latestAlbums={MusicAlbumSamples.reverse()}
	/>

export const PlayAlbum = () =>
	<PlayContent 
		channel={ChannelDataSample}
		featuredAlbums={FeaturedAlbums}
		tracks={Album1TrackSamples}
		currentTrackIndex={3}
	/>
