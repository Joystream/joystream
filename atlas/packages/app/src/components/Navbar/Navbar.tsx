import React, { useState } from 'react'
import { navigate, Link, RouteComponentProps } from '@reach/router'

import routes from '@/config/routes'
import { Icon } from '@/shared/components'
import { Header, NavigationContainer, StyledIcon, StyledSearchbar, CancelButton, Logo } from './Navbar.style'

const Navbar: React.FC<RouteComponentProps> = () => {
  const [search, setSearch] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.currentTarget.value)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || (e.key === 'NumpadEnter' && search.trim() !== '')) {
      navigate(routes.search(search))
    }
  }

  const handleFocus = () => {
    setIsSearching(true)
  }

  const handleCancel = () => {
    setSearch('')
    setIsSearching(false)
  }
  return (
    <Header isSearching={isSearching}>
      {!isSearching && (
        <NavigationContainer>
          <Link to="/">
            <Logo />
          </Link>
          <Link to="/">
            <StyledIcon name="home" />
          </Link>
          <Link to="/browse">
            <StyledIcon name="binocular" />
          </Link>
        </NavigationContainer>
      )}

      <StyledSearchbar
        placeholder="Search..."
        onChange={handleChange}
        value={search}
        onKeyPress={handleKeyPress}
        onFocus={handleFocus}
      />
      {isSearching && (
        <CancelButton onClick={handleCancel}>
          <Icon name="times" />
        </CancelButton>
      )}
    </Header>
  )
}

export default Navbar
