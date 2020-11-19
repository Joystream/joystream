import { css } from '@emotion/core'
import styled from '@emotion/styled'
import { colors, sizes, spacing } from '../../theme'

const imageTopOverflow = '2rem'
const containerPadding = '22px'

export const OuterContainer = styled.article`
  display: flex;
  min-height: calc(178px + ${imageTopOverflow});
  padding-top: ${imageTopOverflow};
  :hover {
    cursor: ${(props) => (props.onClick ? 'pointer' : 'default')};
  }
`

type InnerContainerProps = {
  animated: boolean
}
const hoverTransition = ({ animated }: InnerContainerProps) =>
  animated
    ? css`
        transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        &:hover {
          transform: translate3d(-${spacing.xs}, -${spacing.xs}, 0);
          border: 1px solid ${colors.white};
          box-shadow: ${spacing.xs} ${spacing.xs} 0 ${colors.blue[500]};
        }
      `
    : null

export const InnerContainer = styled.div<InnerContainerProps>`
  background-color: ${colors.gray[800]};
  color: ${colors.gray[300]};

  width: calc(156px + calc(2 * ${containerPadding}));
  padding: 0 ${containerPadding};

  display: flex;
  flex-direction: column;
  align-items: center;
  ${hoverTransition}
`

export const Info = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  margin-top: ${sizes.b3}px;
  padding: 0 ${sizes.b1}px;
  max-width: 100%;
`

export const AvatarContainer = styled.div`
  width: 100%;
  height: 156px;
  position: relative;
  margin-top: -${imageTopOverflow};
  z-index: 2;
`
