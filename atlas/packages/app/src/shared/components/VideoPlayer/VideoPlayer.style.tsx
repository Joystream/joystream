import { css } from '@emotion/core'
import { breakpoints } from '../../theme'

export type VideoPlayerStyleProps = {
  width?: string | number
  height?: string | number
  responsive?: boolean
  ratio?: string
}

export const makeStyles = ({ width = '100%', height = '100%' }: VideoPlayerStyleProps) => {
  return {
    containerStyles: css`
      max-width: ${breakpoints.medium};
      & .video-player {
      }
    `,
    playerStyles: css`
      width: ${width};
      height: ${height};
    `,
  }
}
