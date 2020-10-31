import React, { useState } from 'react'
import { RouteComponentProps, Link, navigate, LinkGetProps } from '@reach/router'

import routes from '@/config/routes'
import {
  Header,
  NavigationContainer,
  StyledIcon,
  StyledSearchbar,
  SearchbarContainer,
  Logo,
  StyledLink,
} from './Navbar.style'

type NavbarProps = RouteComponentProps

const Navbar: React.FC<NavbarProps> = () => {
  const [search, setSearch] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === 'NumpadEnter') && search.trim()) {
      navigate(routes.search(search))
    }
    if (e.key === 'Escape' || e.key === 'Esc') {
      setIsFocused(false)
      setSearch('')
      e.currentTarget.blur()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsFocused(true)
    setSearch(e.currentTarget.value)
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleCancel = () => {
    setSearch('')
    setIsFocused(false)
  }
  return (
    <Header hasFocus={isFocused}>
      <NavigationContainer>
        <Link to="/">
          <Logo />
        </Link>
        <StyledLink to="/" getProps={isActive}>
          <StyledIcon name="home" />
          <span>Home</span>
        </StyledLink>
        <StyledLink to={routes.browse()} getProps={isActive}>
          <StyledIcon name="binocular" />
          <span>Browse</span>
        </StyledLink>
      </NavigationContainer>
      <SearchbarContainer>
        <StyledSearchbar
          placeholder="Search..."
          onChange={handleChange}
          value={search}
          onKeyDown={handleKeyPress}
          onFocus={handleFocus}
          onCancel={handleCancel}
          showCancelButton={isFocused}
          controlled
        />
      </SearchbarContainer>
    </Header>
  )
}

const isActive = ({ isCurrent }: LinkGetProps) => {
  return isCurrent ? { 'data-active': 'true' } : {}
}

export default Navbar
