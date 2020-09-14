import { shuffle } from 'lodash'
import { channelSources, coverSources } from './mockImages'
import { ChannelFields } from '@/api/queries/__generated__/ChannelFields'

const rawChannels = [
  {
    id: 'acc5d2e6-9769-410f-a75f-dca4e3311ef5',
    handle: 'eleifend',
    totalViews: 3743422,
  },
  {
    id: '8ec449d7-ea83-4733-8844-24f4ec6df796',
    handle: 'ipsum primis in faucibus',
    totalViews: 125,
  },
  {
    id: 'b0f895d7-06eb-4f0a-83a6-914ac89a1e3b',
    handle: 'augue luctus tincidunt',
    totalViews: 3189965,
  },
  {
    id: '5c9237ae-34af-4c6a-b175-7e0e2e632d0b',
    handle: 'vel',
    totalViews: 3759,
  },
  {
    id: 'e7d5f6c0-e4a5-43dc-a950-160418867ad1',
    handle: 'elementum ligula',
    totalViews: 16,
  },
  {
    id: '7df156ea-b7be-4911-b721-e25be826011f',
    handle: 'phasellus sit amet erat nulla',
    totalViews: 4344626,
  },
  {
    id: 'c81d9e66-fc1a-4c3c-95b4-a2589e19d430',
    handle: 'amet sapien dignissim',
    totalViews: 239128,
  },
  {
    id: 'ca51ed2b-0ae7-4806-bc12-327326c47ff3',
    handle: 'maecenas rhoncus aliquam',
    totalViews: 1300671,
  },
  {
    id: '015f411a-5ebd-40a3-aee5-9fab3b433bb0',
    handle: 'et commodo vulputate justo',
    totalViews: 4834863,
  },
  {
    id: 'e9bc9b46-04c6-49a4-ab26-445a271f5a06',
    handle: 'in',
    totalViews: 1509,
  },
]

type RawChannel = ChannelFields

const shuffledRawChannels = shuffle(rawChannels)
const mockChannels: RawChannel[] = shuffledRawChannels.map((rawChannel, idx) => ({
  ...rawChannel,
  __typename: 'Channel',
  avatarPhotoURL: channelSources[idx % channelSources.length],
  coverPhotoURL: coverSources[idx % coverSources.length],
}))

export default mockChannels
