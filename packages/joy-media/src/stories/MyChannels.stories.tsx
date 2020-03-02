import React from 'react';
import '../common/index.css';

import { GenericAccountId } from '@polkadot/types';
import { ChannelsByOwner } from '../channels/ChannelsByOwner';
import { AllMockChannels } from './data/ChannelSamples';
import { withMockTransport } from './withMockTransport';
import EditForm from '../channels/EditChannel';
import { EditChannelView } from '../channels/EditChannel.view';
import { ChannelId } from '@joystream/types/content-working-group';
import { AccountIdSamples } from './data/AccountIdSamples';

export default { 
	title: 'Media | My channels',
	decorators: [ withMockTransport ],
};

// TODO pass to mocked MyMembershipContext provider via Stories decorators:
const accountId = new GenericAccountId(AccountIdSamples.Alice);

export const DefaultState = () =>
	<ChannelsByOwner accountId={accountId} />;

export const ChannelCreationSuspended = () =>
	<ChannelsByOwner accountId={accountId} suspended={true} />;

export const YouHaveChannels = () =>
	<ChannelsByOwner accountId={accountId} channels={AllMockChannels} />;

export const DefaultEditForm = () =>
	<EditForm />;

export const MockEditFormView = () =>
	<EditChannelView id={new ChannelId(1)} />;
