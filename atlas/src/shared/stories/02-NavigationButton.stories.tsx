import React from 'react'
import { NavButton } from '../components'

export default {
  title: 'NavButton',
  component: NavButton,
}

export const PrimaryRight = () => <NavButton />

export const PrimaryLeft = () => <NavButton direction="left" />

export const SecondaryRight = () => <NavButton variant="secondary" />

export const SecondaryLeft = () => <NavButton variant="secondary" direction="left" />

export const AppNavigation = () => (
  <div>
    <NavButton variant="secondary" direction="left" />
    <NavButton variant="secondary" direction="right" />
  </div>
)
