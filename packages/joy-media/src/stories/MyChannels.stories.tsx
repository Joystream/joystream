import React from 'react';
import '../channels/index.css';

import { withKnobs } from '@storybook/addon-knobs';
import { MyChannels } from '../channels/MyChannels';
import { ChannelsDataSamples } from './data/ChannelsSamples';

export default { 
    title: 'Media | My channels',
    decorators: [withKnobs],
};

export const DefaultState = () =>
	<MyChannels />

export const ChannelCreationSuspended = () =>
	<MyChannels suspended={true} />

export const YouHaveChannels = () =>
	<MyChannels channels={ChannelsDataSamples} />
