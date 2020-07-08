import React from 'react';
import { number, select, text, withKnobs } from '@storybook/addon-knobs';
import * as faker from 'faker';

import { Option, Text, u32, u128 } from '@polkadot/types';
import { Balance } from '@polkadot/types/interfaces';

import {
  Opening,
  ApplicationRationingPolicy,
  StakingPolicy
} from '@joystream/types/hiring';
import { mockStage } from '../mocks';
import {
  OpeningView,
  OpeningStakeAndApplicationStatus
} from './Opportunities';

import {
  stateMarkup
} from '../openingStateMarkup';

import { ApplicationStakeRequirement, RoleStakeRequirement } from '../StakeRequirement';
import { OpeningStageClassification, OpeningState } from '../classifiers';
import { OpeningMetadata } from '../OpeningMetadata';

import 'semantic-ui-css/semantic.min.css';
import '@polkadot/joy-roles/index.sass';
import { WorkingGroups } from '../working_groups';

export default {
  title: 'Roles / Components / Opportunities groups tab',
  decorators: [withKnobs],
  excludeStories: [
    'tomorrow',
    'yesterday',
    'opening',
    'stateOptions',
    'newMockHumanReadableText'
  ]
};

export function tomorrow (): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
}

export function yesterday (): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
}

export function newMockHumanReadableText (obj: any) {
  return new Text(JSON.stringify(obj));
}

export const opening = new Opening({
  created: new u32(100),
  stage: mockStage,
  max_review_period_length: new u32(100),
  application_rationing_policy: new Option(ApplicationRationingPolicy),
  application_staking_policy: new Option(StakingPolicy),
  role_staking_policy: new Option(StakingPolicy),
  human_readable_text: newMockHumanReadableText({
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
              title: 'your name',
              type: 'text'
            }
          ]
        },
        {
          title: 'About you',
          questions: [
            {
              title: 'your name',
              type: 'text area'
            }
          ]
        }
      ]
    },
    reward: text('Reward', '10 JOY per block', 'Role'),
    process: {
      details: [
        'Some custom detail'
      ]
    }
  })
});

const stateOptions: any = (function () {
  const options: any = {};
  stateMarkup.forEach((value, key) => {
    options[value.description] = key;
  });
  return options;
}());

export function OpportunitySandbox () {
  const stage: OpeningStageClassification = {
    state: select('State', stateOptions, OpeningState.AcceptingApplications, 'Opening'),
    starting_block: number('Created block', 2956498, {}, 'Opening'),
    starting_block_hash: 'somehash',
    starting_time: yesterday(),
    review_end_block: 3956498,
    review_end_time: tomorrow()
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

  const applications: OpeningStakeAndApplicationStatus = {
    numberOfApplications: number('Applications count', 0, applicationSliderOptions, 'Role rationing policy'),
    maxNumberOfApplications: number('Application max', 0, applicationSliderOptions, 'Role rationing policy'),
    requiredApplicationStake: new ApplicationStakeRequirement(
      new u128(number('Application stake', 500, moneySliderOptions, 'Role stakes'))
    ),
    requiredRoleStake: new RoleStakeRequirement(
      new u128(number('Role stake', 0, moneySliderOptions, 'Role stakes'))
    ),
    defactoMinimumStake: new u128(0)
  };

  const defactoMinimumStake: Balance = new u128(number('Dynamic min stake', 0, moneySliderOptions, 'Role stakes'));

  const meta: OpeningMetadata = {
    id: '1',
    group: WorkingGroups.ContentCurators
  };

  return (
    <OpeningView
      meta={meta}
      opening={opening}
      stage={stage}
      applications={applications}
      defactoMinimumStake={defactoMinimumStake}
      block_time_in_seconds={3}
    />
  );
}
