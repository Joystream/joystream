import styled from '@emotion/styled'

import { Searchbar, Icon } from '@/shared/components'
import { colors, sizes } from '@/shared/theme'
import { ReactComponent as UnstyledLogo } from '@/assets/logo.svg'

type NavbarStyleProps = {
  hasFocus: boolean
}

export const Logo = styled(UnstyledLogo)`
  width: ${sizes.b12}px;
  height: ${sizes.b12}px;
`

export const NavigationContainer = styled.div`
  display: flex;
  align-items: center;
  > * + * {
    margin-left: ${sizes.b6}px;
  }
`

export const StyledSearchbar = styled(Searchbar)`
  transition: width 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
  will-change: width;
`
export const SearchbarContainer = styled.div`
  display: flex;
  justify-content: center;
`
export const StyledIcon = styled(Icon)`
  color: ${colors.gray[300]};
  &:hover {
    color: ${colors.white};
    cursor: pointer;
  }
`

export const Header = styled.header<NavbarStyleProps>`
  display: grid;
  grid-template-columns: 1fr 3fr 1fr;
  width: 100%;
  padding: ${(props) => (props.hasFocus ? `${sizes.b2}px` : `${sizes.b3}px ${sizes.b8}px`)};
  border-bottom: 1px solid ${colors.gray[800]};
  background-color: ${(props) => (props.hasFocus ? colors.gray[900] : colors.black)};
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);

  ${StyledSearchbar} {
    width: ${(props) => (props.hasFocus ? '1156px' : '385px')};
  }
`
