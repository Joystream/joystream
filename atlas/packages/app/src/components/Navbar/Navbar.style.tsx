import styled from '@emotion/styled'

import { Searchbar, Icon } from '@/shared/components'
import { colors } from '@/shared/theme'
import { ReactComponent as UnstyledLogo } from '@/assets/logo.svg'

export const Header = styled.header<{ isSearching: boolean }>`
  display: grid;
  grid-template-columns: ${(props) => (props.isSearching ? `134px 1fr 134px` : `repeat(3, 1fr)`)};
  grid-template-areas: ${(props) => (props.isSearching ? `". searchbar cancel"` : `"navigation searchbar ."`)};
  width: 100%;
  padding: ${(props) => (props.isSearching ? '8px' : '12px 32px')};
  border-bottom: 1px solid ${colors.gray[800]};
  background-color: ${(props) => (props.isSearching ? colors.gray[900] : colors.black)};
`

export const Logo = styled(UnstyledLogo)`
  width: 48px;
  height: 48px;
`

export const NavigationContainer = styled.div`
  display: flex;
  grid-area: navigation;
  align-items: center;
  > * + * {
    margin-left: 24px;
  }
`

export const StyledSearchbar = styled(Searchbar)`
  width: 100%;
  grid-area: searchbar;
`

export const StyledIcon = styled(Icon)`
  color: ${colors.gray[600]};
  &:hover {
    color: ${colors.white};
    cursor: pointer;
  }
`

export const CancelButton = styled.div`
  width: 48px;
  height: 48px;
  color: ${colors.white};
  grid-area: cancel;
  display: flex;
  justify-content: center;
  align-items: center;
  justify-self: end;
  :hover {
    cursor: pointer;
  }
`
