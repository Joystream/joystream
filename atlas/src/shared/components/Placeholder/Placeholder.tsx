import { keyframes } from '@emotion/core'
import styled from '@emotion/styled'
import { colors } from '@/shared/theme'
import { darken } from 'polished'

type PlaceholderProps = {
  width?: string | number
  height?: string | number
  rounded?: boolean
}

const getPropValue = (v: string | number) => (typeof v === 'string' ? v : `${v}px`)

const pulse = keyframes`
  0, 100% { 
    background-color: ${colors.gray[400]}
  }
  50% {
    background-color: ${darken(0.15, colors.gray[400])}
  }
`
const Placeholder = styled.div<PlaceholderProps>`
  width: ${({ width = '100%' }) => getPropValue(width)};
  height: ${({ height = '100%' }) => getPropValue(height)};
  border-radius: ${({ rounded = false }) => (rounded ? '100%' : '0')};
  background-color: ${colors.gray['400']};
  animation: ${pulse} 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
`

export default Placeholder
