import React, { useState } from 'react'
import { HamburgerButton } from '../components'

export default {
  title: 'HamburgerButton',
  component: HamburgerButton,
}

export const Default = () => {
  const [active, setActive] = useState(false)
  return <HamburgerButton active={active} onClick={() => setActive(!active)} />
}
