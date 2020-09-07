import React from 'react';
import '../common/index.scss';

import { ChannelsByOwner } from '../channels/ChannelsByOwner';
import { AllMockChannels } from './data/ChannelSamples';
import { withMockTransport } from './withMockTransport';
import EditForm from '../channels/EditChannel';
import { EditChannelView } from '../channels/EditChannel.view';
import { AccountIdSamples } from './data/AccountIdSamples';
import { createType } from '@joystream/types';

export default {
  title: 'Media | My channels',
  decorators: [withMockTransport]
};

// TODO pass to mocked MyMembershipContext provider via Stories decorators:
const accountId = createType('AccountId', AccountIdSamples.Alice);

export const DefaultState = () =>
  <ChannelsByOwner accountId={accountId} />;

export const ChannelCreationSuspended = () =>
  <ChannelsByOwner accountId={accountId} suspended={true} />;

export const YouHaveChannels = () =>
  <ChannelsByOwner accountId={accountId} channels={AllMockChannels} />;

export const DefaultEditForm = () =>
  <EditForm />;

export const MockEditFormView = () =>
  <EditChannelView id={createType('ChannelId', 1)} />;
