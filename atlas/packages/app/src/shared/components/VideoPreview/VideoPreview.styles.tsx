import styled from '@emotion/styled'
import { colors, spacing, typography } from '../../theme'
import Avatar from '../Avatar'
import { Play } from '../../icons'

const HOVER_BORDER_SIZE = '2px'

type CoverImageProps = {
  displayPosterPlaceholder?: boolean
}

type ContainerProps = {
  clickable: boolean
}

type ChannelProps = {
  channelClickable: boolean
}

export const CoverContainer = styled.div`
  width: 320px;
  height: 190px;

  transition-property: box-shadow, transform;
  transition-duration: 0.4s;
  transition-timing-function: cubic-bezier(0.165, 0.84, 0.44, 1);

  position: relative;
`

export const CoverImage = styled.img<CoverImageProps>`
  width: 100%;
  height: 100%;
  background-image: ${({ displayPosterPlaceholder }) =>
    displayPosterPlaceholder ? `linear-gradient(${colors.gray[300]}, ${colors.gray[700]})` : 'none'};
  background-size: cover;
  object-fit: cover;
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

// Play icon is incorrectly typed as string
export const CoverPlayIcon = styled(Play as any)`
  transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  transform: translateY(40px);
`

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

export const Container = styled.div<ContainerProps>`
  color: ${colors.gray[300]};
  cursor: ${({ clickable }) => (clickable ? 'pointer' : 'auto')};
  display: inline-block;
  ${({ clickable }) =>
    clickable &&
    `
				&:hover {
					${CoverContainer} {
						transform: translate(-${spacing.xs}, -${spacing.xs});
						box-shadow: ${spacing.xs} ${spacing.xs} 0 ${colors.blue['500']};
					}

					${CoverHoverOverlay} {
						opacity: 1;
					}
					
					${CoverPlayIcon} {
						transform: translateY(0);
					}

					${ProgressOverlay} {
						bottom: ${HOVER_BORDER_SIZE};
					}
				}
			`}
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

export const InfoContainer = styled.div`
  display: flex;
  margin-top: ${spacing.s};
`

export const StyledAvatar = styled(Avatar)<ChannelProps>`
  width: 40px;
  height: 40px;
  margin-right: ${spacing.xs};
  cursor: ${({ channelClickable }) => (channelClickable ? 'pointer' : 'auto')};
`

export const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: start;
`

export const TitleHeader = styled.h3`
  margin: 0;
  font-weight: ${typography.weights.bold};
  font-size: ${typography.sizes.h6};
  line-height: 1.25rem;
  color: ${colors.white};
  display: inline-block;
`

export const ChannelName = styled.span<ChannelProps>`
  font-size: ${typography.sizes.subtitle2};
  line-height: 1.25rem;
  display: inline-block;
  cursor: ${({ channelClickable }) => (channelClickable ? 'pointer' : 'auto')};
`

export const MetaText = styled.span`
  margin-top: ${spacing.xs};
  font-size: ${typography.sizes.subtitle2};
`
