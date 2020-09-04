import styled from '@emotion/styled'
import { colors } from '@/shared/theme'

export const TabsGroup = styled.div`
  display: flex;
`

type TabProps = {
  selected: boolean
}

export const Tab = styled.div<TabProps>`
  width: 120px;
  padding: 22px 0;
  font-size: 14px;
  color: ${(props) => (props.selected ? colors.white : colors.gray[300])};
  text-transform: capitalize;
  text-align: center;
  border-bottom: ${(props) => (props.selected ? `4px solid ${colors.blue[500]}` : 'none')};
  :hover {
    cursor: pointer;
  }
`
