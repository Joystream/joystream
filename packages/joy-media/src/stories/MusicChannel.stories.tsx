import React from 'react';
import '../common/index.css';

import { withKnobs } from '@storybook/addon-knobs';
import { ChannelsDataSample } from './data/ChannelSamples';
import { ViewMusicChannel } from '../channels/ViewMusicChannel';
import { MusicAlbumSamples } from './data/MusicAlbumSamples';

export default { 
    title: 'Media | Music channel',
    decorators: [withKnobs],
};

export const EmptyMusicChannel = () =>
	<ViewMusicChannel channel={ChannelsDataSample} />

export const MusicChannelWithAlbumsOnly = () =>
	<ViewMusicChannel channel={ChannelsDataSample} albums={MusicAlbumSamples} />
