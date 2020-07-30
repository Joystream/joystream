import { DateTime, Duration } from 'luxon'
import Channel from './channel'
import VideoMedia from './videoMedia'

type Video = {
  id: string
  title: string
  description: string
  views: number
  createdAt: DateTime
  duration: Duration
  posterURL: string
  media: VideoMedia
  channel: Channel
}

export default Video
