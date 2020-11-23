import React from 'react'
import styled from '@emotion/styled'
import { fluidRange } from 'polished'
import { colors, spacing, typography } from '../../theme'
import Avatar from '../Avatar'
import Icon from '../Icon'
import { HOVER_BORDER_SIZE, fadeInAnimation } from './VideoPreviewBase.styles'

type MainProps = {
  main: boolean
}

type ChannelProps = {
  channelClickable: boolean
}

type ScalesWithCoverProps = {
  scalingFactor: number
}
type ClickableProps = {
  clickable?: boolean
}
export const CoverImage = styled.img`
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`

export const CoverHoverOverlay = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  opacity: 0;

  transition: opacity 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);

  border: ${HOVER_BORDER_SIZE} solid ${colors.white};
  background: linear-gradient(180deg, #000000 0%, rgba(0, 0, 0, 0) 100%);

  display: flex;
  justify-content: center;
  align-items: center;
`

export const CoverIcon = styled(Icon)`
  transform: translateY(40px);
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  width: 54px;
  height: 54px;
  color: ${colors.white};
`

export const CoverPlayIcon = ({ ...props }) => <CoverIcon name="play" {...props} />

export const ProgressOverlay = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: ${spacing.xxs};
  background-color: ${colors.white};
`

export const ProgressBar = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  height: 100%;
  width: 0;
  background-color: ${colors.blue['500']};
`

export const CoverDurationOverlay = styled.div`
  position: absolute;
  bottom: ${spacing.xs};
  right: ${spacing.xs};
  padding: ${spacing.xxs} ${spacing.xs};
  background-color: ${colors.black};
  color: ${colors.white};
  font-size: ${typography.sizes.body2};
`

export const StyledAvatar = styled(Avatar)<ChannelProps>`
  width: 100%;
  height: 100%;
  cursor: ${({ channelClickable }) => (channelClickable ? 'pointer' : 'auto')};
`

export const TitleHeader = styled.h3<MainProps & ScalesWithCoverProps & ClickableProps>`
  margin: 0;
  font-weight: ${typography.weights.bold};
  font-size: calc(${(props) => props.scalingFactor} * ${typography.sizes.h6});
  ${({ main }) => main && fluidRange({ prop: 'fontSize', fromSize: '24px', toSize: '40px' })};
  line-height: ${({ main }) => (main ? 1 : 1.25)};
  cursor: ${(props) => (props.clickable ? 'pointer' : 'auto')};
  ${fadeInAnimation};
`

export const ChannelName = styled.span<ChannelProps & ScalesWithCoverProps>`
  font-size: calc(${(props) => props.scalingFactor} * ${typography.sizes.subtitle2});
  line-height: 1.25rem;
  display: inline-block;
  cursor: ${({ channelClickable }) => (channelClickable ? 'pointer' : 'auto')};
  ${fadeInAnimation};
`

export const MetaText = styled.span<MainProps & ScalesWithCoverProps>`
  font-size: ${({ main, scalingFactor }) =>
    main ? typography.sizes.h6 : `calc(${scalingFactor}*${typography.sizes.subtitle2})`};
  ${fadeInAnimation};
`
