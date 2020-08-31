import React from 'react';
import { withKnobs } from '@storybook/addon-knobs';

import {
  Container
} from 'semantic-ui-react';

import {
  u128
} from '@polkadot/types';

import {
  CurrentRoles, CurrentRolesProps,
  Application, ApplicationProps,
  ApplicationStatus, ApplicationStatusProps,
  Applications
} from './MyRoles';

import {
  CancelledReason
  , OpeningState
} from '../classifiers';

import 'semantic-ui-css/semantic.min.css';
import '@polkadot/joy-roles/index.sass';

import {
  opening,
  tomorrow,
  yesterday
} from './Opportunities.stories';

import { CuratorId } from '@joystream/types/content-working-group';
import { WorkingGroups, workerRoleNameByGroup } from '../working_groups';

export default {
  title: 'Roles / Components / My roles tab / Elements',
  decorators: [withKnobs]
};

type TestProps = {
  _description: string;
}

export function CurrentRolesFragment () {
  const props: CurrentRolesProps = {
    currentRoles: [
      {
        workerId: new CuratorId(1),
        name: workerRoleNameByGroup[WorkingGroups.StorageProviders],
        reward: new u128(321),
        stake: new u128(100),
        group: WorkingGroups.StorageProviders,
        CTAs: [
          {
            title: 'Unstake',
            callback: () => { console.log('Unstake'); }
          }
        ]
      },
      {
        workerId: new CuratorId(1),
        name: 'Some other role',
        url: 'some URL',
        reward: new u128(321),
        stake: new u128(12343200),
        group: WorkingGroups.ContentCurators,
        CTAs: [
          {
            title: 'Leave role',
            callback: () => { console.log('Leave role'); }
          }
        ]
      }

    ]
  };
  return (
    <CurrentRoles {...props} />
  );
}

export function ApplicationStatusFragment () {
  const permutations: (ApplicationStatusProps & TestProps)[] = [
    {
      _description: 'Application open; within capacity',
      rank: 15,
      capacity: 20,
      openingStatus: OpeningState.AcceptingApplications
    },
    {
      _description: 'Application open; over capacity',
      rank: 21,
      capacity: 20,
      openingStatus: OpeningState.AcceptingApplications
    },
    {
      _description: 'Application open; you cancelled',
      rank: 21,
      capacity: 20,
      openingStatus: OpeningState.AcceptingApplications,
      cancelledReason: CancelledReason.ApplicantCancelled
    },
    {
      _description: 'Application open; hirer cancelled',
      rank: 21,
      capacity: 20,
      openingStatus: OpeningState.AcceptingApplications,
      cancelledReason: CancelledReason.HirerCancelledApplication
    },
    {
      _description: 'Application in review',
      rank: 15,
      capacity: 20,
      openingStatus: OpeningState.InReview
    },
    {
      _description: 'Application in review; crowded out',
      rank: 21,
      capacity: 20,
      openingStatus: OpeningState.InReview
    },
    {
      _description: 'Application in review; you cancelled',
      rank: 21,
      capacity: 20,
      openingStatus: OpeningState.InReview,
      cancelledReason: CancelledReason.ApplicantCancelled
    },
    {
      _description: 'Application in review; hirer cancelled',
      rank: 21,
      capacity: 20,
      openingStatus: OpeningState.InReview,
      cancelledReason: CancelledReason.HirerCancelledApplication
    },
    {
      _description: 'Application complete; not hired',
      rank: 21,
      capacity: 20,
      openingStatus: OpeningState.Complete
    },
    {
      _description: 'Application complete; hired',
      rank: 21,
      capacity: 20,
      openingStatus: OpeningState.Complete,
      hired: true
    }
  ];

  return (
    <Container className="outer">
      {permutations.map((permutation, key) => (
        <Container key={key} className="current-applications outer">
          <h4>{permutation._description}</h4>
          <ApplicationStatus {...permutation} />
        </Container>
      ))}
    </Container>
  );
}

const permutations: (ApplicationProps & TestProps)[] = [
  {
    _description: '1. Application open',
    id: 1,
    meta: {
      id: '1',
      group: WorkingGroups.ContentCurators
    },
    stage: {
      state: OpeningState.AcceptingApplications,
      starting_block: 2956498,
      starting_block_hash: 'somehash',
      starting_time: yesterday()
    },
    opening: opening,
    applicationStake: new u128(5),
    roleStake: new u128(15),
    cancelCallback: () => { /* do nothing */ },
    rank: 15,
    capacity: 20
  },
  {
    _description: '2. Application open; crowded out',
    id: 1,
    meta: {
      id: '1',
      group: WorkingGroups.ContentCurators
    },
    stage: {
      state: OpeningState.AcceptingApplications,
      starting_block: 2956498,
      starting_block_hash: 'somehash',
      starting_time: yesterday()
    },
    opening: opening,
    applicationStake: new u128(5),
    roleStake: new u128(15),
    cancelCallback: () => { /* do nothing */ },
    rank: 21,
    capacity: 20
  },
  {
    _description: '3. Application in review',
    id: 1,
    meta: {
      id: '1',
      group: WorkingGroups.ContentCurators
    },
    stage: {
      state: OpeningState.InReview,
      starting_block: 2956498,
      starting_block_hash: 'somehash',
      starting_time: yesterday(),
      review_end_time: tomorrow(),
      review_end_block: 12345
    },
    opening: opening,
    applicationStake: new u128(5),
    roleStake: new u128(15),
    cancelCallback: () => { /* do nothing */ },
    rank: 15,
    capacity: 20
  },
  {
    _description: '4. Application in review; crowded out',
    id: 1,
    meta: {
      id: '1',
      group: WorkingGroups.ContentCurators
    },
    stage: {
      state: OpeningState.InReview,
      starting_block: 2956498,
      starting_block_hash: 'somehash',
      starting_time: yesterday(),
      review_end_time: tomorrow(),
      review_end_block: 12345
    },
    opening: opening,
    applicationStake: new u128(5),
    roleStake: new u128(15),
    cancelCallback: () => { /* do nothing */ },
    rank: 21,
    capacity: 20
  },
  {
    _description: '5. Application review complete; unsuccessful',
    id: 1,
    meta: {
      id: '1',
      group: WorkingGroups.ContentCurators
    },
    stage: {
      state: OpeningState.Complete,
      starting_block: 2956498,
      starting_block_hash: 'somehash',
      starting_time: yesterday()
    },
    opening: opening,
    applicationStake: new u128(5),
    roleStake: new u128(15),
    cancelCallback: () => { /* do nothing */ },
    rank: 21,
    capacity: 20
  },
  {
    _description: '6. Opening cancelled',
    id: 1,
    meta: {
      id: '1',
      group: WorkingGroups.ContentCurators
    },
    stage: {
      state: OpeningState.Cancelled,
      starting_block: 2956498,
      starting_block_hash: 'somehash',
      starting_time: yesterday()
    },
    opening: opening,
    applicationStake: new u128(5),
    roleStake: new u128(15),
    cancelCallback: () => { /* do nothing */ },
    rank: 21,
    capacity: 20,
    cancelledReason: CancelledReason.HirerCancelledOpening
  }
];

export function ApplicationFragment () {
  return (
    <Container className="outer my-roles">
      {permutations.map((permutation, key) => (
        <Container key={key} className="current-applications outer">
          <h4>{permutation._description}</h4>
          <Application {...permutation} />
        </Container>
      ))}
    </Container>
  );
}

export function ApplicationsFragment () {
  const cancelCallback = () => { /* do nothing */ };
  return (
    <Container className="outer my-roles">
      <Applications applications={permutations} cancelCallback={cancelCallback} />
    </Container>
  );
}
