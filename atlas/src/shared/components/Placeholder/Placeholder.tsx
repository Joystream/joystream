import { keyframes } from '@emotion/core'
import styled from '@emotion/styled'
import { colors } from '@/shared/theme'

type PlaceholderProps = {
  width?: string | number
  height?: string | number
  rounded?: boolean
}

const getPropValue = (v: string | number) => (typeof v === 'string' ? v : `${v}px`)

const pulse = keyframes`
  0, 100% {
    opacity: 1
  }
  50% {
    opacity: 0.5
  }
`
const Placeholder = styled.div<PlaceholderProps>`
  width: ${({ width = '100%' }) => getPropValue(width)};
  height: ${({ height = '100%' }) => getPropValue(height)};
  border-radius: ${({ rounded = false }) => (rounded ? '100%' : '0')};
  background-color: ${colors.gray['400']};
  animation: ${pulse} 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
`

export default Placeholder
