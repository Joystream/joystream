import React from 'react';
import '../common/index.css';

import { ChannelDataSample } from './data/ChannelSamples';
import { ViewMusicChannel } from '../channels/ViewMusicChannel';
import { MusicAlbumSamples } from './data/MusicAlbumSamples';
import { AllMusicTrackSamples } from './data/MusicTrackSamples';
import { withMockTransport } from './withMockTransport';

export default { 
    title: 'Media | Music channel',
    decorators: [ withMockTransport ],
};

export const EmptyMusicChannel = () =>
	<ViewMusicChannel channel={ChannelDataSample} />

export const MusicChannelWithAlbumsOnly = () =>
	<ViewMusicChannel channel={ChannelDataSample} albums={MusicAlbumSamples} />

export const MusicChannelWithAlbumAndTracks = () =>
<>
<div>tracks:{ AllMusicTrackSamples.length}</div>
	<ViewMusicChannel
		channel={ChannelDataSample}
		albums={MusicAlbumSamples}
		tracks={AllMusicTrackSamples}
	/>
	</>
