import React, { useEffect, useState } from 'react'
import { Container, PlayOverlay, StyledPlayIcon } from './VideoPlayer.style'
import { useVideoJsPlayer, VideoJsConfig } from './videoJsPlayer'

type VideoPlayerProps = {
  className?: string
  autoplay?: boolean
  isInBackground?: boolean
  playing?: boolean
  onDataLoaded?: () => void
} & VideoJsConfig

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  className,
  autoplay,
  isInBackground,
  playing,
  onDataLoaded,
  ...videoJsConfig
}) => {
  const [player, playerRef] = useVideoJsPlayer(videoJsConfig)
  const [playOverlayVisible, setPlayOverlayVisible] = useState(true)
  const [initialized, setInitialized] = useState(false)

  const displayPlayOverlay = playOverlayVisible && !isInBackground

  useEffect(() => {
    if (!player) {
      return
    }

    const handler = () => {
      setInitialized(true)
    }

    player.on('loadstart', handler)

    return () => {
      player.off('loadstart', handler)
    }
  }, [player])

  useEffect(() => {
    if (!player) {
      return
    }

    const handler = () => {
      if (onDataLoaded) {
        onDataLoaded()
      }
    }

    player.on('loadeddata', handler)

    return () => {
      player.off('loadeddata', handler)
    }
  }, [player, onDataLoaded])

  useEffect(() => {
    if (!player || !initialized || !autoplay) {
      return
    }

    const playPromise = player.play()
    if (playPromise) {
      playPromise.catch((e) => {
        console.warn('Autoplay failed:', e)
      })
    }
  }, [player, initialized, autoplay])

  useEffect(() => {
    if (!player) {
      return
    }

    if (playing != null) {
      if (playing) {
        const playPromise = player.play()
        if (playPromise) {
          playPromise.catch((e) => {
            console.error('Video play failed:', e)
          })
        }
      } else {
        player.pause()
      }
    }
  })

  useEffect(() => {
    if (!player) {
      return
    }

    const handler = () => {
      setPlayOverlayVisible(false)
    }

    player.on('play', handler)

    return () => {
      player.off('play', handler)
    }
  })

  const handlePlayOverlayClick = () => {
    if (!player) {
      return
    }

    player.play()
  }

  return (
    <Container className={className} isInBackground={isInBackground}>
      {displayPlayOverlay && (
        <PlayOverlay onClick={handlePlayOverlayClick}>
          <StyledPlayIcon />
        </PlayOverlay>
      )}
      <div data-vjs-player>
        <video ref={playerRef} className="video-js" />
      </div>
    </Container>
  )
}

export default VideoPlayer
