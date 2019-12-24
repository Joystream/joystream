import React from 'react'
import { text, withKnobs } from '@storybook/addon-knobs'

import {
  Container,
} from 'semantic-ui-react'

import {
  u128,
} from '@polkadot/types'

import {
  CurrentRoles, CurrentRolesProps,
  Application, ApplicationProps,
  ApplicationStatus, ApplicationStatusProps, CancelledReason,
  Applications,
} from "./MyRoles"

import 'semantic-ui-css/semantic.min.css'
import '@polkadot/joy-roles/index.sass'

import {
  creator,
  opening,
  tomorrow,
  yesterday,
} from './Opportunities.stories'
import { OpeningState } from "../classifiers"

import { Opening } from "@joystream/types/hiring"

export default {
  title: 'Roles / Components / My roles tab / Elements',
  decorators: [withKnobs],
}

type TestProps = {
  _description: string
}

export function CurrentRolesFragment() {
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

export function ApplicationStatusFragment() {
  const permutations: (ApplicationStatusProps & TestProps)[] = [
    {
      _description: "Application open; within capacity",
      rank: 15,
      capacity: 20,
      openingStatus: OpeningState.AcceptingApplications,
    },
    {
      _description: "Application open; over capacity",
      rank: 21,
      capacity: 20,
      openingStatus: OpeningState.AcceptingApplications,
    },
    {
      _description: "Application open; you cancelled",
      rank: 21,
      capacity: 20,
      openingStatus: OpeningState.AcceptingApplications,
      cancelledReason: CancelledReason.ApplicantCancelled,
    },
    {
      _description: "Application open; hirer cancelled",
      rank: 21,
      capacity: 20,
      openingStatus: OpeningState.AcceptingApplications,
      cancelledReason: CancelledReason.HirerCancelledApplication,
    },
    {
      _description: "Application in review",
      rank: 15,
      capacity: 20,
      openingStatus: OpeningState.InReview,
    },
    {
      _description: "Application in review; crowded out",
      rank: 21,
      capacity: 20,
      openingStatus: OpeningState.InReview,
    },
    {
      _description: "Application in review; you cancelled",
      rank: 21,
      capacity: 20,
      openingStatus: OpeningState.InReview,
      cancelledReason: CancelledReason.ApplicantCancelled,
    },
    {
      _description: "Application in review; hirer cancelled",
      rank: 21,
      capacity: 20,
      openingStatus: OpeningState.InReview,
      cancelledReason: CancelledReason.HirerCancelledApplication,
    },
    {
      _description: "Application complete; not hired",
      rank: 21,
      capacity: 20,
      openingStatus: OpeningState.Complete,
    },
    {
      _description: "Application complete; hired",
      rank: 21,
      capacity: 20,
      openingStatus: OpeningState.Complete,
      hired: true,
    },
  ]

  return (
    <Container className="outer">
      {permutations.map((permutation, key) => (
        <Container key={key} className="current-applications outer">
          <h4>{permutation._description}</h4>
          <ApplicationStatus {...permutation} />
        </Container>
      ))}
    </Container>
  )
}

const permutations: (ApplicationProps & TestProps)[] = [
  {
    _description: "1. Application open",
    creator: creator,
    stage: {
      uri: text("URL (to copy)", "https://some.url/#1", "Opening"),
      state: OpeningState.AcceptingApplications,
      starting_block: 2956498,
      starting_block_hash: "somehash",
      created_time: yesterday(),
    },
    opening: opening,
    applicationStake: new u128(5),
    roleStake: new u128(15),
    cancelCallback: (o: Opening) => { },
    rank: 15,
    capacity: 20,
  },
  {
    _description: "2. Application open; crowded out",
    creator: creator,
    stage: {
      uri: text("URL (to copy)", "https://some.url/#1", "Opening"),
      state: OpeningState.AcceptingApplications,
      starting_block: 2956498,
      starting_block_hash: "somehash",
      created_time: yesterday(),
    },
    opening: opening,
    applicationStake: new u128(5),
    roleStake: new u128(15),
    cancelCallback: () => { },
    rank: 21,
    capacity: 20,
  },
  {
    _description: "3. Application in review",
    creator: creator,
    stage: {
      uri: text("URL (to copy)", "https://some.url/#1", "Opening"),
      state: OpeningState.InReview,
      starting_block: 2956498,
      starting_block_hash: "somehash",
      created_time: yesterday(),
      review_end_time: tomorrow(),
      review_end_block: 12345,
    },
    opening: opening,
    applicationStake: new u128(5),
    roleStake: new u128(15),
    cancelCallback: () => { },
    rank: 15,
    capacity: 20,
  },
  {
    _description: "4. Application in review; crowded out",
    creator: creator,
    stage: {
      uri: text("URL (to copy)", "https://some.url/#1", "Opening"),
      state: OpeningState.InReview,
      starting_block: 2956498,
      starting_block_hash: "somehash",
      created_time: yesterday(),
      review_end_time: tomorrow(),
      review_end_block: 12345,
    },
    opening: opening,
    applicationStake: new u128(5),
    roleStake: new u128(15),
    cancelCallback: () => { },
    rank: 21,
    capacity: 20,
  },
  {
    _description: "5. Application review complete; unsuccessful",
    creator: creator,
    stage: {
      uri: text("URL (to copy)", "https://some.url/#1", "Opening"),
      state: OpeningState.Complete,
      starting_block: 2956498,
      starting_block_hash: "somehash",
      created_time: yesterday(),
    },
    opening: opening,
    applicationStake: new u128(5),
    roleStake: new u128(15),
    cancelCallback: () => { },
    rank: 21,
    capacity: 20,
  },
  {
    _description: "6. Opening cancelled",
    creator: creator,
    stage: {
      uri: text("URL (to copy)", "https://some.url/#1", "Opening"),
      state: OpeningState.Cancelled,
      starting_block: 2956498,
      starting_block_hash: "somehash",
      created_time: yesterday(),
    },
    opening: opening,
    applicationStake: new u128(5),
    roleStake: new u128(15),
    cancelCallback: () => { },
    rank: 21,
    capacity: 20,
    cancelledReason: CancelledReason.HirerCancelledOpening
  },
]

export function ApplicationFragment() {
  return (
    <Container className="outer my-roles">
      {permutations.map((permutation, key) => (
        <Container key={key} className="current-applications outer">
          <h4>{permutation._description}</h4>
          <Application {...permutation} />
        </Container>
      ))}
    </Container>
  )
}

export function ApplicationsFragment() {
  const cancelCallback = () => { }
  return (
    <Container className="outer my-roles">
      <Applications applications={permutations} cancelCallback={cancelCallback} />
    </Container>
  )
}
