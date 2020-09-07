import { css } from '@emotion/core'
import styled from '@emotion/styled'
import { colors, spacing } from '../../theme'

const imageTopOverflow = '2rem'

export const OuterContainer = styled.article`
  width: 200px;
  height: ${`calc(186px + ${imageTopOverflow})`};
  padding-top: ${imageTopOverflow};
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
  display: flex;
  flex-direction: column;
  height: 100%;
  ${hoverTransition}
`

export const Info = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  margin: 12px auto 10px;
`

export const AvatarContainer = styled.div`
  width: 156px;
  height: 156px;
  position: relative;
  margin: -${imageTopOverflow} auto 0;
  z-index: 2;
`
