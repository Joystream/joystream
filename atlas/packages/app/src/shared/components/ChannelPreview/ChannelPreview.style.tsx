import { makeStyles, StyleFn } from '../../utils'
import { colors } from '../../theme'

export type ChannelPreviewStyleProps = {
  channelAvatar: string
  width: number
  height: number
}

const imageTopOverflow = '2rem'

const outerContainer: StyleFn = (_, { width = 200, height = 186 }) => ({
  width,
  height: `calc(${height}px + ${imageTopOverflow})`,
  paddingTop: imageTopOverflow,
})

const innerContainer: StyleFn = () => ({
  backgroundColor: colors.gray[800],
  color: colors.gray[300],
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
})

const info: StyleFn = () => ({
  margin: `12px auto 10px`,
  textAlign: 'center',
  '& > h2': {
    margin: 0,
    fontSize: '1rem',
  },
  '& > span': {
    fontSize: '0.875rem',
    lineHeight: 1.43,
  },
})

const avatar: StyleFn = () => ({
  width: 156,
  height: 156,
  position: 'relative',
  margin: `-${imageTopOverflow} auto 0`,
  zIndex: 2,
})

export const useCSS = (props: Partial<ChannelPreviewStyleProps>) => ({
  outerContainer: makeStyles([outerContainer])(props),
  innerContainer: makeStyles([innerContainer])(props),
  info: makeStyles([info])(props),
  avatar: makeStyles([avatar])(props),
})
