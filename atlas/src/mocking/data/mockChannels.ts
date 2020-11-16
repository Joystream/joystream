import { channelAvatarSources, channelPosterSources } from './mockImages'
import { ChannelFields } from '@/api/queries/__generated__/ChannelFields'
import rawChannels from './raw/channels.json'

export type MockChannel = ChannelFields

const mockChannels: MockChannel[] = rawChannels.map((rawChannel, idx) => ({
  ...rawChannel,
  __typename: 'Channel',
  avatarPhotoUrl: channelAvatarSources[idx % channelAvatarSources.length],
  coverPhotoUrl: channelPosterSources[idx % channelPosterSources.length],
}))

export default mockChannels
