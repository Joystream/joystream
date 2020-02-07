import React from 'react';
import '../common/index.css';

import { ExploreContent } from '../explore/ExploreContent';
import { FeaturedAlbums } from './data/MusicAlbumSamples';
import { PlayContent } from '../explore/PlayContent';
import { Album1TrackSamples } from './data/MusicTrackSamples';
import { MockMusicChannel } from './data/ChannelSamples';
import { withMockTransport } from './withMockTransport';

export default { 
	title: 'Media | Explore',
	decorators: [ withMockTransport ],
};

export const DefaultState = () =>
	<ExploreContent />;

export const PlayAlbum = () =>
	<PlayContent 
		channel={MockMusicChannel}
		featuredAlbums={FeaturedAlbums}
		tracks={Album1TrackSamples}
		currentTrackIndex={3}
	/>;
