import React, { useEffect, useState } from 'react'
import { Container, PlayOverlay, StyledPlayIcon } from './VideoPlayer.style'
import { useVideoJsPlayer, VideoJsConfig } from './videoJsPlayer'

type VideoPlayerProps = {
  className?: string
  autoplay?: boolean
} & VideoJsConfig

const VideoPlayer: React.FC<VideoPlayerProps> = ({ className, autoplay, ...videoJsConfig }) => {
  const [player, playerRef] = useVideoJsPlayer(videoJsConfig)
  const [playOverlayVisible, setPlayOverlayVisible] = useState(true)

  useEffect(() => {
    if (!player || !autoplay) {
      return
    }

    const handler = async () => {
      try {
        await player.play()
      } catch (e) {
        console.warn('Autoplay failed:', e)
      }
    }

    player.on('loadstart', handler)

    return () => {
      player.off('loadstart', handler)
    }
  }, [player, autoplay])

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
    <Container className={className}>
      {playOverlayVisible && (
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
