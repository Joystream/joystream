import { DateTime } from 'luxon'
import Channel from './channel'

type Video = {
  title: string
  views: number
  createdAt: DateTime
  description: string
  channel: Channel
}

export default Video
