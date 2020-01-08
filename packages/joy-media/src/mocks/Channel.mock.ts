
import { newEntityId } from './EntityId.mock';
import { ChannelType } from '../schemas/channel/Channel';
import { PublicationStatus } from './PublicationStatus.mock';
import { CurationStatus } from './CurationStatus.mock';

export const Channel: ChannelType = {
  id: newEntityId(), // TODO here should be ChannelId
  content: 'Music Channel',
  channelName: 'top_notes',
  thumbnail: 'https://images.unsplash.com/photo-1485561222814-e6c50477491b?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=200&q=60',
  cover: 'https://images.unsplash.com/photo-1514119412350-e174d90d280e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=900&q=80',
  description: 'Music is an art form and cultural activity whose medium is sound organized in time. General definitions of music include common elements such as pitch (which governs melody and harmony), rhythm (and its associated concepts tempo, meter, and articulation), dynamics (loudness and softness), and the sonic qualities of timbre and texture (which are sometimes termed the "color" of a musical sound).',
  publicationStatus: PublicationStatus,
  curationStatus: CurationStatus
};
