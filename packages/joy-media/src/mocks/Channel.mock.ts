
import { newEntityId } from './EntityId.mock';
import { ChannelType } from '../schemas/channel/Channel';
import { PublicationStatus } from './PublicationStatus.mock';
import { CurationStatus } from './CurationStatus.mock';

export const Channel: ChannelType = {
  id: newEntityId(), // TODO here should be ChannelId
  verified: false,
  content: 'video',
  handle: 'bicycles_rocknroll',
  title: 'Bicycles and Rock-n-Roll',
  description: 'A bicycle, also called a cycle or bike, is a human-powered or motor-powered, pedal-driven, single-track vehicle, having two wheels attached to a frame, one behind the other. A is called a cyclist, or bicyclist.',
  avatar: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=200&q=60',
  banner: 'https://images.unsplash.com/photo-1494488802316-82250d81cfcc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=900&q=60',
  publicationStatus: PublicationStatus,
  curationStatus: CurationStatus
};
