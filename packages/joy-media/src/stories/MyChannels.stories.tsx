import React from 'react';
import '../common/index.css';

import { MyChannels } from '../channels/MyChannels';
import { ChannelsDataSamples } from './data/ChannelSamples';
import { withMockTransport } from './withMockTransport';

export default { 
    title: 'Media | My channels',
    decorators: [ withMockTransport ],
};

export const DefaultState = () =>
	<MyChannels />

export const ChannelCreationSuspended = () =>
	<MyChannels suspended={true} />

export const YouHaveChannels = () =>
	<MyChannels channels={ChannelsDataSamples} />
