import React from 'react';
import '../channels/index.css';

import { withKnobs } from '@storybook/addon-knobs';
import { MyChannels } from '../channels/MyChannels';
import { ChannelEntity } from '../entities/MusicChannelEntity';

export default { 
    title: 'Media | My channels',
    decorators: [withKnobs],
};

export const DefaultState = () =>
	<MyChannels />

export const ChannelCreationSuspended = () =>
	<MyChannels suspended={true} />

// export const YouHaveChannels = () =>
// 	<MyChannels channels={channels} />

const channels: ChannelEntity[] = [
	{
		title: 'Slowly Notes',
		description: '',
		avatarUrl: 'https://images.unsplash.com/photo-1485561222814-e6c50477491b?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=200&q=60',
		coverUrl: 'https://images.unsplash.com/photo-1452724931113-5ab6340ce080?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=900&q=80'
	}
]