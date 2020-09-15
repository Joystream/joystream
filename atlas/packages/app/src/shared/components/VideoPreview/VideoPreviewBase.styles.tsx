import styled from '@emotion/styled'
import { colors, spacing } from '@/shared/theme'
import { CoverHoverOverlay, CoverIcon, ProgressOverlay } from './VideoPreview.styles'

export const HOVER_BORDER_SIZE = '2px'

type ContainerProps = {
  clickable: boolean
}

export const MAX_VIDEO_PREVIEW_WIDTH = '320px'

export const CoverContainer = styled.div`
  width: 100%;
  height: 190px;

  transition-property: box-shadow, transform;
  transition-duration: 0.4s;
  transition-timing-function: cubic-bezier(0.165, 0.84, 0.44, 1);

  position: relative;
`

export const Container = styled.article<ContainerProps>`
  max-width: ${MAX_VIDEO_PREVIEW_WIDTH};
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
					
					${CoverIcon} {
						transform: translateY(0);
					}

					${ProgressOverlay} {
						bottom: ${HOVER_BORDER_SIZE};
					}
				}
			`}
`

export const InfoContainer = styled.div`
  display: flex;
  margin-top: ${spacing.s};
`

export const AvatarContainer = styled.div`
  width: 40px;
  min-width: 40px;
  height: 40px;
  margin-right: ${spacing.xs};
`

export const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: start;
  width: 100%;
`

export const MetaContainer = styled.div`
  margin-top: ${spacing.xs};
  width: 100%;
`
