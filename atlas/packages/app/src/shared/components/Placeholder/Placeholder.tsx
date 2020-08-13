import styled from '@emotion/styled'
import { colors } from '@/shared/theme'

type PlaceholderProps = {
  width?: string
  height?: string
  rounded?: boolean
}

const Placeholder = styled.div<PlaceholderProps>`
  width: ${({ width = '100%' }) => width};
  height: ${({ height = '100%' }) => height};
  border-radius: ${({ rounded = false }) => (rounded ? '100%' : '0')};
  background-color: ${colors.gray['400']};
`

export default Placeholder
