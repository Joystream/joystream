/* eslint-disable @typescript-eslint/no-var-requires */

// generate mock videos metadata for all the files in scripts/videos directory

const path = require('path')
const fs = require('fs')
const { promisify } = require('util')
const ffmpeg = require('fluent-ffmpeg')
const faker = require('faker')
const { saveToFile } = require('./utils')

const readdir = promisify(fs.readdir)
const ffprobe = promisify(ffmpeg.ffprobe)

const HOSTED_ASSET_PREFIX = 'https://eu-central-1.linodeobjects.com/atlas-assets/videos/'

const VIDEOS_DIR = 'videos'

const OUTPUT_FILENAME = 'videosMedia.json'
const videosPath = path.join(__dirname, VIDEOS_DIR)

const CODEC_MAP = {
  h264: 'H264_mpeg4',
  vp8: 'VP8_WEBM',
}

const getVideoInfo = async (videoName) => {
  const videoPath = path.join(videosPath, videoName)

  const metadata = await ffprobe(videoPath)
  const stream = metadata.streams.find((s) => s.codec_type === 'video')

  return {
    id: faker.random.uuid(),
    codec: CODEC_MAP[stream.codec_name],
    pixelWidth: stream.width,
    pixelHeight: stream.height,
    duration: Math.floor(metadata.format.duration),
    size: metadata.format.size,
    location: {
      URL: HOSTED_ASSET_PREFIX + videoName,
    },
  }
}

const main = async () => {
  const videos = await readdir(videosPath)

  const promises = videos.map(getVideoInfo)
  const infos = await Promise.all(promises)
  await saveToFile(infos, OUTPUT_FILENAME)
}

main()
