import React from 'react';
import { withKnobs } from '@storybook/addon-knobs';
import { Card, Container } from 'semantic-ui-react';

import { u128 } from '@polkadot/types';

import {
  OpeningBodyApplicationsStatus, OpeningStakeAndApplicationStatus,
  OpeningBodyReviewInProgress,
  OpeningBodyStakeRequirement, StakeRequirementProps,
  OpeningHeader
} from './Opportunities';
import {
  openingClass
} from '../openingStateMarkup';
import { ApplicationStakeRequirement, RoleStakeRequirement, StakeType } from '../StakeRequirement';

import { tomorrow, yesterday } from './Opportunities.stories';

import { OpeningStageClassification, OpeningState } from '../classifiers';
import { OpeningMetadata } from '../OpeningMetadata';

import 'semantic-ui-css/semantic.min.css';
import '@polkadot/joy-roles/index.sass';
import { WorkingGroups } from '../working_groups';

export default {
  title: 'Roles / Components / Opportunities groups tab / Elements',
  decorators: [withKnobs]
};

type TestProps = {
  _description: string;
}

const meta: OpeningMetadata = {
  id: '1',
  group: WorkingGroups.ContentCurators
};

export function OpeningHeaderByState () {
  const stages: OpeningStageClassification[] = [
    {
      state: OpeningState.WaitingToBegin,
      starting_block: 2956498,
      starting_block_hash: 'somehash',
      starting_time: yesterday()
    },
    {
      state: OpeningState.AcceptingApplications,
      starting_block: 2956498,
      starting_block_hash: 'somehash',
      starting_time: yesterday()
    },
    {
      state: OpeningState.InReview,
      starting_block: 102456,
      starting_block_hash: 'somehash',
      starting_time: yesterday()
    },
    {
      state: OpeningState.Complete,
      starting_block: 10345,
      starting_block_hash: 'somehash',
      starting_time: yesterday()
    },
    {
      state: OpeningState.Cancelled,
      starting_block: 104,
      starting_block_hash: 'somehash',
      starting_time: yesterday()
    }
  ];

  return (
    <Container>
      {stages.map((stage, key) => (
        <Container className={'inner opening ' + openingClass(stage.state)} key={key}>
          <Card fluid className="container">
            <Card.Content className="header">
              <OpeningHeader stage={stage} meta={meta} />
            </Card.Content>
          </Card>
        </Container>
      ))}
    </Container>
  );
}

export function OpeningApplicationsStatusByState () {
  const permutations: (OpeningStakeAndApplicationStatus & TestProps)[] = [
    {
      _description: 'No limit, no applications, no stake',
      numberOfApplications: 0,
      maxNumberOfApplications: 0,
      requiredApplicationStake: new ApplicationStakeRequirement(new u128(0)),
      requiredRoleStake: new RoleStakeRequirement(new u128(0)),
      defactoMinimumStake: new u128(0)
    },
    {
      _description: 'No limit, some applications, no stake',
      numberOfApplications: 15,
      maxNumberOfApplications: 0,
      requiredApplicationStake: new ApplicationStakeRequirement(new u128(0)),
      requiredRoleStake: new RoleStakeRequirement(new u128(0)),
      defactoMinimumStake: new u128(0)
    },
    {
      _description: 'Limit, no applications, no stake',
      numberOfApplications: 0,
      maxNumberOfApplications: 20,
      requiredApplicationStake: new ApplicationStakeRequirement(new u128(0)),
      requiredRoleStake: new RoleStakeRequirement(new u128(0)),
      defactoMinimumStake: new u128(0)
    },
    {
      _description: 'Limit, some applications, no stake',
      numberOfApplications: 10,
      maxNumberOfApplications: 20,
      requiredApplicationStake: new ApplicationStakeRequirement(new u128(0)),
      requiredRoleStake: new RoleStakeRequirement(new u128(0)),
      defactoMinimumStake: new u128(0)
    },
    {
      _description: 'Limit, full applications, no stake (application impossible)',
      numberOfApplications: 20,
      maxNumberOfApplications: 20,
      requiredApplicationStake: new ApplicationStakeRequirement(new u128(0)),
      requiredRoleStake: new RoleStakeRequirement(new u128(0)),
      defactoMinimumStake: new u128(0)
    },
    {
      _description: 'No limit, no applications, some stake',
      numberOfApplications: 0,
      maxNumberOfApplications: 0,
      requiredApplicationStake: new ApplicationStakeRequirement(new u128(10)),
      requiredRoleStake: new RoleStakeRequirement(new u128(0)),
      defactoMinimumStake: new u128(0)
    },
    {
      _description: 'No limit, some applications, some stake',
      numberOfApplications: 15,
      maxNumberOfApplications: 0,
      requiredApplicationStake: new ApplicationStakeRequirement(new u128(10)),
      requiredRoleStake: new RoleStakeRequirement(new u128(0)),
      defactoMinimumStake: new u128(0)
    },
    {
      _description: 'Limit, no applications, some stake',
      numberOfApplications: 0,
      maxNumberOfApplications: 20,
      requiredApplicationStake: new ApplicationStakeRequirement(new u128(10)),
      requiredRoleStake: new RoleStakeRequirement(new u128(0)),
      defactoMinimumStake: new u128(0)
    },
    {
      _description: 'Limit, some applications, some stake',
      numberOfApplications: 10,
      maxNumberOfApplications: 20,
      requiredApplicationStake: new ApplicationStakeRequirement(new u128(10)),
      requiredRoleStake: new RoleStakeRequirement(new u128(0)),
      defactoMinimumStake: new u128(0)
    },
    {
      _description: 'Limit, full applications, some stake',
      numberOfApplications: 20,
      maxNumberOfApplications: 20,
      requiredApplicationStake: new ApplicationStakeRequirement(new u128(10)),
      requiredRoleStake: new RoleStakeRequirement(new u128(0)),
      defactoMinimumStake: new u128(0)
    }
  ];

  return (
    <Container>
      {permutations.map((permutation, key) => (
        <Container className="outer opening" key={key}>
          <h4>{permutation._description}</h4>
          <Container className="main">
            <OpeningBodyApplicationsStatus {...permutation} />
          </Container>
        </Container>
      ))}
    </Container>
  );
}

export function OpeningApplicationsStakeRequirementByStake () {
  const permutations: (StakeRequirementProps & TestProps)[] = [
    {
      _description: 'No stakes required (should be empty)',
      requiredApplicationStake: new ApplicationStakeRequirement(new u128(0)),
      requiredRoleStake: new RoleStakeRequirement(new u128(0)),
      defactoMinimumStake: new u128(0),
      maxNumberOfApplications: 0
    },
    {
      _description: 'App stake required; no role stake required',
      requiredApplicationStake: new ApplicationStakeRequirement(new u128(500)),
      requiredRoleStake: new RoleStakeRequirement(new u128(0)),
      defactoMinimumStake: new u128(0),
      maxNumberOfApplications: 0
    },
    {
      _description: 'App stake required >; no role stake required',
      requiredApplicationStake: new ApplicationStakeRequirement(new u128(500), StakeType.AtLeast),
      requiredRoleStake: new RoleStakeRequirement(new u128(0)),
      defactoMinimumStake: new u128(0),
      maxNumberOfApplications: 0
    },
    {
      _description: 'No app stake required; role stake required',
      requiredApplicationStake: new ApplicationStakeRequirement(new u128(0)),
      requiredRoleStake: new RoleStakeRequirement(new u128(101)),
      defactoMinimumStake: new u128(0),
      maxNumberOfApplications: 0
    },
    {
      _description: 'No app stake required; role stake required',
      requiredApplicationStake: new ApplicationStakeRequirement(new u128(0), StakeType.AtLeast),
      requiredRoleStake: new RoleStakeRequirement(new u128(102)),
      defactoMinimumStake: new u128(0),
      maxNumberOfApplications: 0
    },
    {
      _description: '>= App stake required; role stake required',
      requiredApplicationStake: new ApplicationStakeRequirement(new u128(101), StakeType.AtLeast),
      requiredRoleStake: new RoleStakeRequirement(new u128(102)),
      defactoMinimumStake: new u128(0),
      maxNumberOfApplications: 0
    },
    {
      _description: 'App stake required; no role stake required; dynamic minimum > 0',
      requiredApplicationStake: new ApplicationStakeRequirement(new u128(500)),
      requiredRoleStake: new RoleStakeRequirement(new u128(0)),
      defactoMinimumStake: new u128(1000),
      maxNumberOfApplications: 20
    }
  ];

  return (
    <Container>
      {permutations.map((permutation, key) => (
        <Container className="outer opening" key={key}>
          <h4>{permutation._description}</h4>
          <Card fluid>
            <Card.Content>
              <Container className="main">
                <OpeningBodyStakeRequirement {...permutation} />
              </Container>
            </Card.Content>
          </Card>
        </Container>
      ))}
    </Container>
  );
}

export function ReviewInProgress () {
  const permutations: (OpeningStageClassification & TestProps)[] = [
    {
      _description: 'Standard control',
      review_end_time: tomorrow(),
      review_end_block: 1000000,
      state: OpeningState.InReview,
      starting_block: 0,
      starting_block_hash: '',
      starting_time: new Date()
    }
  ];

  return (
    <Container>
      {permutations.map((permutation, key) => (
        <Container className="outer opening" key={key}>
          <h4>{permutation._description}</h4>
          <Card fluid>
            <Card.Content>
              <Container className="main">
                <OpeningBodyReviewInProgress {...permutation} />
              </Container>
            </Card.Content>
          </Card>
        </Container>
      ))}
    </Container>
  );
}
