import React from 'react'
import { number, text, withKnobs } from '@storybook/addon-knobs'

import {
  Container,
} from 'semantic-ui-react'

import {
  u128,
} from '@polkadot/types'

import {
  CurrentRoles, CurrentRolesProps,
  Application, ApplicationProps,
  Applications, ApplicationsProps,
} from "./MyRoles"

import 'semantic-ui-css/semantic.min.css'
import '@polkadot/joy-roles/index.sass'

import { creator } from './Opportunities.stories'

export default {
  title: 'Roles / Components / My roles tab / Elements',
  decorators: [withKnobs],
}

type TestProps = {
  _description: string
}

export function CurrentRoleFragment() {
  const props: CurrentRolesProps = {
    currentRoles: [
      {
        name: "Storage provider",
        reward: "10 JOY per block",
        stake: new u128(100),
        CTAs: [
          {
            title: "Unstake",
            callback: () => { console.log("Unstake") }
          }
        ]
      },
      {
        name: "Some other role",
        url: "some URL",
        reward: "10 JOY per block",
        stake: new u128(12343200),
        CTAs: [
          {
            title: "Leave role",
            callback: () => { console.log("Leave role") }
          }
        ]
      },

    ]
  }
  return (
    <CurrentRoles {...props} />
  )
}

export function ApplicationFragment() {
  const permutations: (ApplicationProps & TestProps)[] = [
    {
      _description: "Application open",
    }
  ]

  return (
    <Container>
      {permutations.map((permutation, key) => (
        <Container key={key} className="current-applications">
          <h4>{permutation._description}</h4>
          <Application {...permutation} creator={creator} />
        </Container>
      ))}
    </Container>
  )
}
