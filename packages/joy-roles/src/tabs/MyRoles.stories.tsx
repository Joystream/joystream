import React from 'react'
import { withKnobs } from '@storybook/addon-knobs'

import {
  Container,
} from 'semantic-ui-react'

import 'semantic-ui-css/semantic.min.css'
import '@polkadot/joy-roles/index.sass'

import {
  ApplicationsFragment,
  CurrentRolesFragment,
} from './MyRoles.elements.stories'

export default {
  title: 'Roles / Components / My roles tab',
  decorators: [withKnobs],
}

export function MyRolesSandbox() {
  return (
    <Container className="my-roles">
      <CurrentRolesFragment />
      <ApplicationsFragment />
    </Container>
  )
}
