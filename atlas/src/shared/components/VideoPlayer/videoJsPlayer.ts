import { RefObject, useEffect, useRef, useState } from 'react'
import videojs, { VideoJsPlayer, VideoJsPlayerOptions } from 'video.js'
import 'video.js/dist/video-js.css'

import { VideoFields_media_location } from '@/api/queries/__generated__/VideoFields'

export type VideoJsConfig = {
  src: VideoFields_media_location
  width?: number
  height?: number
  fluid?: boolean
  fill?: boolean
}

type VideoJsPlayerHook = (config: VideoJsConfig) => [VideoJsPlayer | null, RefObject<HTMLVideoElement>]
export const useVideoJsPlayer: VideoJsPlayerHook = ({ fill, fluid, height, src, width }) => {
  const playerRef = useRef<HTMLVideoElement>(null)
  const [player, setPlayer] = useState<VideoJsPlayer | null>(null)

  const parsedSource = src.__typename === 'HTTPVideoMediaLocation' ? src.URL : 'TODO'

  useEffect(() => {
    const videoJsOptions: VideoJsPlayerOptions = {
      controls: true,
    }

    const playerInstance = videojs(playerRef.current, videoJsOptions)
    setPlayer(playerInstance)

    return () => {
      playerInstance.dispose()
    }
  }, [])

  useEffect(() => {
    if (!player) {
      return
    }

    player.src({
      src: parsedSource,
      type: 'video/mp4',
    })
  }, [player, parsedSource])

  useEffect(() => {
    if (!player || !width) {
      return
    }

    player.width(width)
  }, [player, width])

  useEffect(() => {
    if (!player || !height) {
      return
    }

    player.height(height)
  }, [player, height])

  useEffect(() => {
    if (!player) {
      return
    }

    player.fluid(Boolean(fluid))
  }, [player, fluid])

  useEffect(() => {
    if (!player) {
      return
    }

    // @ts-ignore @types/video.js is outdated and doesn't provide types for some newer video.js features
    player.fill(Boolean(fill))
  }, [player, fill])

  return [player, playerRef]
}
