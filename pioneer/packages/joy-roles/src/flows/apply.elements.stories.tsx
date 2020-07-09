// TODO: FIXME: Remove the ts-nocheck and fix errors!
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useState } from 'react';
import { number, object, withKnobs } from '@storybook/addon-knobs';
import { Card, Container, Message } from 'semantic-ui-react';

import { u128, GenericAccountId } from '@polkadot/types';
import { Balance } from '@polkadot/types/interfaces';

import {
  ApplicationDetails
} from '@joystream/types/schemas/role.schema';
import {
  ConfirmStakesStage, ConfirmStakesStageProps,
  ProgressStepsView, ProgressStepsProps, ProgressSteps,
  ApplicationDetailsStage, ApplicationDetailsStageProps,
  SubmitApplicationStage, SubmitApplicationStageProps,
  DoneStage, DoneStageProps,
  FundSourceSelector,
  StakeRankSelector, StakeRankSelectorProps,
  ConfirmStakes2Up, ConfirmStakes2UpProps
} from './apply';
import {
  OpeningStakeAndApplicationStatus
} from '../tabs/Opportunities';
import {
  ApplicationStakeRequirement,
  RoleStakeRequirement,
  StakeType
} from '../StakeRequirement';

import 'semantic-ui-css/semantic.min.css';
import '@polkadot/joy-roles/index.sass';

export default {
  title: 'Roles / Components / Apply flow / Elements',
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

const applications: OpeningStakeAndApplicationStatus = {
  numberOfApplications: number('Applications count', 0, applicationSliderOptions, 'Role rationing policy'),
  maxNumberOfApplications: number('Application max', 0, applicationSliderOptions, 'Role rationing policy'),
  requiredApplicationStake: new ApplicationStakeRequirement(
    new u128(number('Application stake', 500, moneySliderOptions, 'Role stakes'))
  ),
  requiredRoleStake: new RoleStakeRequirement(
    new u128(number('Role stake', 0, moneySliderOptions, 'Role stakes'))
  )
};

type TestProps = {
  _description: string;
}

export function ProgressIndicator () {
  const permutations: (ProgressStepsProps & TestProps)[] = [
    {
      _description: 'Three steps, second active',
      activeStep: ProgressSteps.SubmitApplication,
      hasConfirmStep: false
    },
    {
      _description: 'Four steps, first active',
      activeStep: ProgressSteps.ConfirmStakes,
      hasConfirmStep: true
    },
    {
      _description: 'Four steps, second active',
      activeStep: ProgressSteps.SubmitApplication,
      hasConfirmStep: true
    }
  ];

  return (
    <Container>
      {permutations.map((permutation, key) => (
        <Container className="outer" key={key}>
          <h4>{permutation._description}</h4>
          <Card fluid>
            <ProgressStepsView {...permutation} />
          </Card>
        </Container>
      ))}
    </Container>
  );
}

export function FundSourceSelectorFragment () {
  const [address, setAddress] = useState<AccountId>();
  const [passphrase, setPassphrase] = useState('');

  const props = {
    transactionFee: new u128(number('Transaction fee', 500, moneySliderOptions, 'Application Tx')),
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
    ]
  };

  return (
    <Container className="apply-flow">
      <Card fluid>
        <Card.Content>
          <FundSourceSelector {...props}
            addressCallback={setAddress}
            passphraseCallback={setPassphrase}
          />
        </Card.Content>
      </Card>
      <Message info>
        <p>Address: {address ? address.toString() : 'not set'}</p>
        <p>Passphrase: {passphrase}</p>
      </Message>
    </Container>
  );
}

export function StakeRankSelectorFragment () {
  const [stake, setStake] = useState<Balance>(new u128(0));

  // List of the minimum stake required to beat each rank
  const slots: Balance[] = [];
  for (let i = 0; i < 10; i++) {
    slots.push(new u128((i * 100) + 10 + i + 1));
  }

  const props: StakeRankSelectorProps = {
    stake: stake,
    setStake: setStake,
    slots: slots,
    step: new u128(10)
  };

  return (
    <Container className="apply-flow">
      <Card fluid>
        <Message info>
          <StakeRankSelector {...props} />
        </Message>
      </Card>
      <Message warning>
        Slots: {JSON.stringify(slots)}<br />
        Stake: {stake.toString()}
      </Message>
    </Container>
  );
}

export function SelectTwoMinimumStakes () {
  const [applicationStake, setApplicationStake] = useState(new u128(1));
  const [roleStake, setRoleStake] = useState(new u128(2));

  // List of the minimum stake required to beat each rank
  const slots: Balance[] = [];
  for (let i = 0; i < 20; i++) {
    slots.push(new u128((i * 100) + 10 + i + 1));
  }

  const props: ConfirmStakes2UpProps & TestProps = {
    _description: 'One fixed stake (application), no limit',
    applications: {
      requiredApplicationStake: new ApplicationStakeRequirement(new u128(1)),
      requiredRoleStake: new RoleStakeRequirement(new u128(2)),
      maxNumberOfApplications: 0,
      numberOfApplications: 0
    },
    defactoMinimumStake: new u128(0),
    step: new u128(5),
    slots: slots,
    selectedApplicationStake: applicationStake,
    setSelectedApplicationStake: setApplicationStake,
    selectedRoleStake: roleStake,
    setSelectedRoleStake: setRoleStake
  };

  return (
    <Container className="apply-flow">
      <Card fluid>
        <Card.Content>
          <ConfirmStakes2Up {...props} />
        </Card.Content>
      </Card>
    </Container>
  );
}

export function StageAConfirmStakes () {
  const permutations: (any & TestProps)[] = [
    {
      _description: 'One fixed stake (application), no limit',
      applications: {
        requiredApplicationStake: new ApplicationStakeRequirement(new u128(10)),
        requiredRoleStake: new RoleStakeRequirement(new u128(0)),
        maxNumberOfApplications: 0,
        numberOfApplications: 0
      },
      defactoMinimumStake: new u128(0)
    },
    {
      _description: 'One fixed stake (role), no limit',
      applications: {
        requiredApplicationStake: new ApplicationStakeRequirement(new u128(0)),
        requiredRoleStake: new RoleStakeRequirement(new u128(1213)),
        maxNumberOfApplications: 0,
        numberOfApplications: 0
      },
      defactoMinimumStake: new u128(0)
    },
    {
      _description: 'Two fixed stakes, no limit',
      applications: {
        requiredApplicationStake: new ApplicationStakeRequirement(new u128(10)),
        requiredRoleStake: new RoleStakeRequirement(new u128(10)),
        maxNumberOfApplications: 0,
        numberOfApplications: 0
      },
      defactoMinimumStake: new u128(0)
    },
    {
      _description: 'One fixed stake (application), 20 applicant limit',
      applications: {
        requiredApplicationStake: new ApplicationStakeRequirement(new u128(10)),
        requiredRoleStake: new RoleStakeRequirement(new u128(0)),
        maxNumberOfApplications: 20,
        numberOfApplications: 0
      },
      defactoMinimumStake: new u128(0)
    },
    {
      _description: 'One fixed stake (role), 20 applicant limit',
      applications: {
        requiredApplicationStake: new ApplicationStakeRequirement(new u128(456)),
        requiredRoleStake: new RoleStakeRequirement(new u128(0)),
        maxNumberOfApplications: 20,
        numberOfApplications: 0
      },
      defactoMinimumStake: new u128(0)
    },
    {
      _description: 'Two fixed stakes, 20 applicant limit',
      applications: {
        requiredApplicationStake: new ApplicationStakeRequirement(new u128(10)),
        requiredRoleStake: new RoleStakeRequirement(new u128(10)),
        maxNumberOfApplications: 20,
        numberOfApplications: 0
      },
      defactoMinimumStake: new u128(0)
    },
    {
      _description: 'One minimum stake (application), no limit',
      applications: {
        requiredApplicationStake: new ApplicationStakeRequirement(new u128(10), StakeType.AtLeast),
        requiredRoleStake: new RoleStakeRequirement(new u128(0)),
        maxNumberOfApplications: 0,
        numberOfApplications: 20
      },
      defactoMinimumStake: new u128(0)
    },
    {
      _description: 'One minimum stake (role), no limit',
      applications: {
        requiredApplicationStake: new ApplicationStakeRequirement(new u128(0)),
        requiredRoleStake: new RoleStakeRequirement(new u128(10), StakeType.AtLeast),
        maxNumberOfApplications: 0,
        numberOfApplications: 20
      },
      defactoMinimumStake: new u128(0)
    },
    {
      _description: 'Two minimum stakes, no limit',
      applications: {
        requiredApplicationStake: new ApplicationStakeRequirement(new u128(10), StakeType.AtLeast),
        requiredRoleStake: new RoleStakeRequirement(new u128(10), StakeType.AtLeast),
        maxNumberOfApplications: 0
      },
      defactoMinimumStake: new u128(0)
    },
    {
      _description: 'Minimum application stake, fixed role stake, no limit',
      applications: {
        requiredApplicationStake: new ApplicationStakeRequirement(new u128(10), StakeType.AtLeast),
        requiredRoleStake: new RoleStakeRequirement(new u128(10)),
        maxNumberOfApplications: 0
      },
      defactoMinimumStake: new u128(0)
    },
    {
      _description: 'Minimum role stake, fixed application stake, no limit',
      applications: {
        requiredApplicationStake: new ApplicationStakeRequirement(new u128(10)),
        requiredRoleStake: new RoleStakeRequirement(new u128(10), StakeType.AtLeast),
        maxNumberOfApplications: 0
      },
      defactoMinimumStake: new u128(0)
    },
    {
      _description: 'One minimum stake (application), 20 applicant limit',
      applications: {
        requiredApplicationStake: new ApplicationStakeRequirement(new u128(10), StakeType.AtLeast),
        requiredRoleStake: new RoleStakeRequirement(new u128(0)),
        maxNumberOfApplications: 0,
        numberOfApplications: 20
      },
      defactoMinimumStake: new u128(0)
    },
    {
      _description: 'One minimum stake (role), 20 applicant limit',
      applications: {
        requiredApplicationStake: new ApplicationStakeRequirement(new u128(0)),
        requiredRoleStake: new RoleStakeRequirement(new u128(10), StakeType.AtLeast),
        maxNumberOfApplications: 0,
        numberOfApplications: 20
      },
      defactoMinimumStake: new u128(0)
    },
    {
      _description: 'Two minimum stakes, 20 applicant limit',
      applications: {
        requiredApplicationStake: new ApplicationStakeRequirement(new u128(10), StakeType.AtLeast),
        requiredRoleStake: new RoleStakeRequirement(new u128(10), StakeType.AtLeast),
        maxNumberOfApplications: 20
      },
      defactoMinimumStake: new u128(0)
    },
    {
      _description: 'Minimum application stake, fixed role stake, 20 applicant limit',
      applications: {
        requiredApplicationStake: new ApplicationStakeRequirement(new u128(10), StakeType.AtLeast),
        requiredRoleStake: new RoleStakeRequirement(new u128(10)),
        maxNumberOfApplications: 0,
        numberOfApplications: 20
      },
      defactoMinimumStake: new u128(0)
    },
    {
      _description: 'Minimum role stake, fixed application stake, 20 applicant limit',
      applications: {
        requiredApplicationStake: new ApplicationStakeRequirement(new u128(10)),
        requiredRoleStake: new RoleStakeRequirement(new u128(10), StakeType.AtLeast),
        maxNumberOfApplications: 0,
        numberOfApplications: 20
      },
      defactoMinimumStake: new u128(0)
    }
  ];

  const keypairs = [
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
  ];

  // List of the minimum stake required to beat each rank
  const slots: Balance[] = [];
  for (let i = 0; i < 20; i++) {
    slots.push(new u128((i * 100) + 10 + i + 1));
  }

  const renders = [];
  permutations.map((permutation, key) => {
    const [applicationStake, setApplicationStake] = useState(new u128(0));
    const [roleStake, setRoleStake] = useState<Balance>(new u128(0));
    const [stakeKeyAddress, setStakeKeyAddress] = useState<AccountId>(null);
    const [stakeKeyPassphrase, setStakeKeyPassphrase] = useState('');

    const [stake, setStake] = useState<Balance>(new u128(0));
    const stakeRankSelectorProps: StakeRankSelectorProps = {
      slots: slots,
      step: new u128(10)
    };

    renders.push(
      (
        <Container className="outer" key={key}>
          <h4>{key}. {permutation._description}</h4>
          <Card fluid>
            <ConfirmStakesStage {...permutation}
              {...stakeRankSelectorProps}
              keypairs={keypairs}
              selectedApplicationStake={applicationStake}
              setSelectedApplicationStake={setApplicationStake}
              selectedRoleStake={roleStake}
              setSelectedRoleStake={setRoleStake}
              keyAddress={stakeKeyAddress}
              setKeyAddress={setStakeKeyAddress}
              keyPassphrase={stakeKeyPassphrase}
              setKeyPassphrase={setStakeKeyPassphrase}
            />
          </Card>
          <Message info>
            A: {applicationStake.toString()}, R: {roleStake.toString()}
          </Message>
        </Container>
      )
    );
  });

  return (
    <Container className="apply-flow">
      {renders.map((render, key) => (
        <div key={key}>{render}</div>
      ))}
    </Container>
  );
}

export function StageBApplicationDetails () {
  const [data, setData] = useState<object>({
    'About you': {
      'Your e-mail address': 'pre-filled'
    }
  });

  const props: ApplicationDetailsStageProps = {
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
    }, 'Application questions'),
    data: data,
    setData: setData,
    nextTransition: () => { /* do nothing */ }
  };

  return (
    <Container className="apply-flow">
      <Card fluid>
        <Card.Content>
          <ApplicationDetailsStage {...props} />
        </Card.Content>
        <Message info>
          {JSON.stringify(data)}
        </Message>
      </Card>
    </Container>
  );
}

export function StageCSubmitApplication () {
  const props: SubmitApplicationStageProps = {
    nextTransition: () => { /* do nothing */ },
    applications: applications,
    transactionFee: new u128(number('Transaction fee', 500, moneySliderOptions, 'Application Tx')),
    transactionDetails: new Map<string, string>([
      ['Extrinsic hash', '0xae6d24d4d55020c645ddfe2e8d0faf93b1c0c9879f9bf2c439fb6514c6d1292e'],
      ['SOmething else', 'abc123']
    ]),
    keypairs: [
      {
        shortName: 'KP1',
        accountId: new GenericAccountId('5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp'),
        balance: new u128(23342)
      },
      {
        shortName: 'KP2',
        accountId: new GenericAccountId('5F5SwL7zwfdDN4UifacVrYKQVVYzoNcoDoGzmhVkaPN2ef8F'),
        balance: new u128(993342)
      },
      {
        shortName: 'KP3',
        accountId: new GenericAccountId('5HmMiZSGnidr3AhUk7hhZa7wJrvYyKEiT8cneyavA1ALkfJc'),
        balance: new u128(242)
      }
    ]
  };

  return (
    <Container className="apply-flow">
      <Card fluid>
        <Card.Content>
          <SubmitApplicationStage {...props} />
        </Card.Content>
      </Card>
    </Container>
  );
}

export function StageDDone () {
  const props: DoneStageProps = {
    applications: applications,
    roleKeyName: 'NEW_ROLE_KEY'
  };

  return (
    <Container className="apply-flow">
      <Card fluid>
        <DoneStage {...props} />
      </Card>
    </Container>
  );
}
