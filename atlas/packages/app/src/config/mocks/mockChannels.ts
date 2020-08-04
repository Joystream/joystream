import { shuffle } from 'lodash'
import { channelSources } from '@/config/mocks/mockImages'
import Channel from '@/types/channel'

const rawChannels = [
  {
    id: 'acc5d2e6-9769-410f-a75f-dca4e3311ef5',
    name: 'eleifend',
    views: 3743422,
  },
  {
    id: '8ec449d7-ea83-4733-8844-24f4ec6df796',
    name: 'ipsum primis in faucibus',
    views: 125,
  },
  {
    id: 'b0f895d7-06eb-4f0a-83a6-914ac89a1e3b',
    name: 'augue luctus tincidunt',
    views: 3189965,
  },
  {
    id: '5c9237ae-34af-4c6a-b175-7e0e2e632d0b',
    name: 'vel',
    views: 3759,
  },
  {
    id: 'e7d5f6c0-e4a5-43dc-a950-160418867ad1',
    name: 'elementum ligula',
    views: 16,
  },
  {
    id: '7df156ea-b7be-4911-b721-e25be826011f',
    name: 'phasellus sit amet erat nulla',
    views: 4344626,
  },
  {
    id: 'c81d9e66-fc1a-4c3c-95b4-a2589e19d430',
    name: 'amet sapien dignissim',
    views: 239128,
  },
  {
    id: 'ca51ed2b-0ae7-4806-bc12-327326c47ff3',
    name: 'maecenas rhoncus aliquam',
    views: 1300671,
  },
  {
    id: '015f411a-5ebd-40a3-aee5-9fab3b433bb0',
    name: 'et commodo vulputate justo',
    views: 4834863,
  },
  {
    id: 'e9bc9b46-04c6-49a4-ab26-445a271f5a06',
    name: 'in',
    views: 1509,
  },
]

const shuffledRawChannels = shuffle(rawChannels)
const unshuffledChannels: Channel[] = shuffledRawChannels.map((rawChannel, idx) => ({
  ...rawChannel,
  avatarURL: channelSources[idx % channelSources.length],
}))
const mockChannels = shuffle(unshuffledChannels)

export default mockChannels
