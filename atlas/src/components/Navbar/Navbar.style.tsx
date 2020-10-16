import styled from '@emotion/styled'

import { Icon, Searchbar } from '@/shared/components'
import { colors, sizes } from '@/shared/theme'
import { ReactComponent as UnstyledLogo } from '@/assets/logo.svg'

const BREAKPOINT = '600px'

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
  margin-right: ${sizes.b3}px;

  > * + * {
    margin-left: ${sizes.b3}px;
    @media screen and (min-width: ${BREAKPOINT}) {
      margin-left: ${sizes.b6}px;
    }
  }
`

export const StyledSearchbar = styled(Searchbar)`
  transition: max-width 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
  will-change: max-width;
`
export const SearchbarContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  justify-self: center;
  width: 100%;
  max-width: 1156px;
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
  width: 100%;

  grid-template-columns: ${({ hasFocus }) => (hasFocus ? '1fr' : '1fr 2fr')};
  padding: ${(props) => (props.hasFocus ? `${sizes.b2}px` : `${sizes.b2}px ${sizes.b4}px`)};
  @media screen and (min-width: ${BREAKPOINT}) {
    grid-template-columns: ${({ hasFocus }) => (hasFocus ? '1fr' : '1fr 2fr 1fr')};
    padding: ${(props) => (props.hasFocus ? `${sizes.b2}px` : `${sizes.b3}px ${sizes.b8}px`)};
  }
  border-bottom: 1px solid ${colors.gray[800]};
  background-color: ${(props) => (props.hasFocus ? colors.gray[900] : colors.black)};
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);

  ${StyledSearchbar} {
    width: 100%;
    max-width: ${(props) => (props.hasFocus ? '100%' : '385px')};
  }
`
