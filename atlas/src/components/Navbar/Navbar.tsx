import React, { useState } from 'react'
import { RouteComponentProps, Link, navigate } from '@reach/router'

import routes from '@/config/routes'
import { Header, NavigationContainer, StyledIcon, StyledSearchbar, SearchbarContainer, Logo } from './Navbar.style'

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
      <div>
        {!isFocused && (
          <NavigationContainer>
            <Link to="/">
              <Logo />
            </Link>
            <Link to="/">
              <StyledIcon name="home" />
            </Link>
            <Link to={routes.browse()}>
              <StyledIcon name="binocular" />
            </Link>
          </NavigationContainer>
        )}
      </div>
      <SearchbarContainer>
        <StyledSearchbar
          placeholder="Search..."
          onChange={handleChange}
          value={search}
          onKeyDown={handleKeyPress}
          onFocus={handleFocus}
          onCancel={handleCancel}
          controlled
        />
      </SearchbarContainer>
    </Header>
  )
}

export default Navbar
