// TODO: FIXME: Remove the ts-nocheck and fix errors!
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from 'react';
import { number, object, select, text, withKnobs } from '@storybook/addon-knobs';
import * as faker from 'faker';

import { u128, GenericAccountId } from '@polkadot/types';
import { Balance } from '@polkadot/types/interfaces';

import { FlowModal } from './apply';
import {
  ApplicationStakeRequirement, RoleStakeRequirement,
  StakeType
} from '../StakeRequirement';

import 'semantic-ui-css/semantic.min.css';
import '@polkadot/joy-roles/index.sass';

export default {
  title: 'Roles / Components / Apply flow',
  decorators: [withKnobs]
};

const applicationSliderOptions = {
  range: true,
  min: 0,
  max: 20,
  step: 1
};

const moneySliderOptions = {
  range: true,
  min: 0,
  max: 1000000,
  step: 500
};

const stakeTypeOptions = {
  Fixed: StakeType.Fixed,
  'At least': StakeType.AtLeast
};

function mockPromise<T = any> (): () => Promise<T> {
  return () => new Promise<T>((resolve, reject) => {
    resolve();
  });
}

export const ApplicationSandbox = () => {
  // List of the minimum stake required to beat each rank
  const slots: Balance[] = [];
  for (let i = 0; i < 20; i++) {
    slots.push(new u128((i * 100) + 10 + i + 1));
  }
  const props = {
    role: {
      version: 1,
      headline: text('Headline', 'Help us curate awesome content', 'Role'),
      job: {
        title: text('Job title', 'Content curator', 'Role'),
        description: text('Job description', faker.lorem.paragraphs(4), 'Role')
      },
      application: {
        sections: [
          {
            title: 'About you',
            questions: [
              {
                title: 'Your name',
                type: 'text'
              },
              {
                title: 'Your e-mail address',
                type: 'text'
              }
            ]
          },
          {
            title: 'Your experience',
            questions: [
              {
                title: 'Why would you be good for this role?',
                type: 'text area'
              }
            ]
          }
        ]
      },
      reward: text('Reward', '10 JOY per block', 'Role'),
      creator: {
        membership: {
          handle: text('Creator handle', 'ben', 'Role')
        }
      },
      process: {
        details: [
          'Some custom detail'
        ]
      }
    },
    applications: {
      numberOfApplications: number('Applications count', 0, applicationSliderOptions, 'Role rationing policy'),
      maxNumberOfApplications: number('Application max', 0, applicationSliderOptions, 'Role rationing policy'),
      requiredApplicationStake: new ApplicationStakeRequirement(
        new u128(number('Application stake', 500, moneySliderOptions, 'Role stakes')),
        select('Application stake type', stakeTypeOptions, StakeType.AtLeast, 'Role stakes')
      ),
      requiredRoleStake: new RoleStakeRequirement(
        new u128(number('Role stake', 500, moneySliderOptions, 'Role stakes')),
        select('Role stake type', stakeTypeOptions, StakeType.Fixed, 'Role stakes')
      ),
      defactoMinimumStake: new u128(0)
    },
    creator: creator,
    transactionFee: new u128(number('Transaction fee', 499, moneySliderOptions, 'Application Tx')),
    keypairs: [
      {
        shortName: 'KP1',
        accountId: new GenericAccountId('5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp'),
        balance: new u128(23342)
      },
      {
        shortName: 'KP2',
        accountId: new GenericAccountId('5DQqNWRFPruFs9YKheVMqxUbqoXeMzAWfVfcJgzuia7NA3D3'),
        balance: new u128(993342)
      },
      {
        shortName: 'KP3',
        accountId: new GenericAccountId('5DBaczGTDhcHgwsZzNE5qW15GrQxxdyros4pYkcKrSUovFQ9'),
        balance: new u128(242)
      }
    ],
    prepareApplicationTransaction: mockPromise(),
    makeApplicationTransaction: mockPromise(),
    transactionDetails: new Map<string, string>([['Detail title', 'Detail value']]),
    hasConfirmStep: true,
    step: new u128(5),
    slots: slots,
    applicationDetails: object('JSON', {
      sections: [
        {
          title: 'About you',
          questions: [
            {
              title: 'Your name',
              type: 'text'
            },
            {
              title: 'Your e-mail address',
              type: 'text'
            }
          ]
        },
        {
          title: 'Your experience',
          questions: [
            {
              title: 'Why would you be good for this role?',
              type: 'text area'
            }
          ]
        }
      ]
    }, 'Application questions')
  };

  return <FlowModal {...props} />;
};
