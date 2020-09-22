import { channelAvatarSources, channelPosterSources } from './mockImages'
import { ChannelFields } from '@/api/queries/__generated__/ChannelFields'
import rawChannels from './raw/channels.json'

type MockChannel = ChannelFields

const mockChannels: MockChannel[] = rawChannels.map((rawChannel, idx) => ({
  ...rawChannel,
  __typename: 'Channel',
  avatarPhotoURL: channelAvatarSources[idx % channelAvatarSources.length],
  coverPhotoURL: channelPosterSources[idx % channelPosterSources.length],
}))

export default mockChannels
