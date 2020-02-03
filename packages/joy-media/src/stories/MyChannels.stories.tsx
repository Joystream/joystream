import React from 'react';
import '../common/index.css';

import { ChannelsByOwner } from '../channels/ChannelsByOwner';
import { ChannelsDataSamples } from './data/ChannelSamples';
import { withMockTransport } from './withMockTransport';
import EditForm from '../channels/EditChannel';
import { EditChannelView } from '../channels/EditChannel.view';
import { MemberId } from '@joystream/types/members';
import { ChannelId } from '@joystream/types/content-working-group';

export default { 
	title: 'Media | My channels',
	decorators: [ withMockTransport ],
};

const memberId = new MemberId(1);

export const DefaultState = () =>
	<ChannelsByOwner memberId={memberId} />;

export const ChannelCreationSuspended = () =>
	<ChannelsByOwner memberId={memberId} suspended={true} />;

export const YouHaveChannels = () =>
	<ChannelsByOwner memberId={memberId} channels={ChannelsDataSamples} />;

export const DefaultEditForm = () =>
	<EditForm />;

export const MockEditFormView = () =>
	<EditChannelView id={new ChannelId(1)} />;
