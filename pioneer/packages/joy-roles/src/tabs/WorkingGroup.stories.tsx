import React from 'react';
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs';

import { u128, GenericAccountId } from '@polkadot/types';

import { MemberId } from '@joystream/types/members';

import { ContentCurators } from '@polkadot/joy-roles/tabs/WorkingGroup';
import { GroupMember } from '../elements';

import { mockProfile } from '../mocks';

import 'semantic-ui-css/semantic.min.css';
import '@polkadot/joy-roles/index.sass';
import { WorkingGroups } from '../working_groups';

export default {
  title: 'Roles / Components / Working groups tab',
  decorators: [withKnobs]
};

export function ContentCuratorsSection () {
  const members: GroupMember[] = [
    {
      memberId: new MemberId(1),
      roleAccount: new GenericAccountId('5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp'),
      profile: mockProfile(
        text('Handle', 'benholdencrowther', 'Ben'),
        text('Avatar URL', 'https://www.benholdencrowther.com/wp-content/uploads/2019/03/Hanging_Gardens_of_Babylon.jpg', 'Ben')
      ),
      title: text('Title', 'Curation lead', 'Ben'),
      stake: new u128(number('Stake', 10101, {}, 'Ben')),
      workerId: 1,
      group: WorkingGroups.ContentCurators
    },
    {
      memberId: new MemberId(2),
      roleAccount: new GenericAccountId('5DfJWGbBAH8hLAg8rcRYZW5BEZbE4BJeCQKoxUeqoyewLSew'),
      profile: mockProfile(text('Handle', 'bwhm0', 'Martin')),
      title: text('Title', 'Content curator', 'Martin'),
      stake: new u128(number('Stake', 10101, {}, 'Martin')),
      workerId: 2,
      group: WorkingGroups.ContentCurators
    },
    {
      memberId: new MemberId(3),
      roleAccount: new GenericAccountId('5DQqNWRFPruFs9YKheVMqxUbqoXeMzAWfVfcJgzuia7NA3D3'),
      profile: mockProfile(
        'yourheropaul',
        'https://yhp.io/img/paul.svg'
      ),
      title: text('Title', 'Content curator', 'Paul'),
      stake: new u128(number('Stake', 10101, {}, 'Paul')),
      workerId: 3,
      group: WorkingGroups.ContentCurators
    },
    {
      memberId: new MemberId(4),
      roleAccount: new GenericAccountId('5GSMNn8Sy8k64mGUWPDafjMZu9bQNX26GujbBQ1LeJpNbrfg'),
      profile: mockProfile(
        'alex_joystream',
        'https://avatars2.githubusercontent.com/u/153928?s=200&v=4'
      ),
      title: text('Title', 'Content curator', 'Alex'),
      stake: new u128(number('Stake', 10101, {}, 'Alex')),
      workerId: 4,
      group: WorkingGroups.ContentCurators
    },
    {
      memberId: new MemberId(5),
      roleAccount: new GenericAccountId('5Gn9n7SDJ7VgHqHQWYzkSA4vX6DCmS5TFWdHxikTXp9b4L32'),
      profile: mockProfile(
        'mokhtar',
        'https://avatars2.githubusercontent.com/u/1621012?s=460&v=4'
      ),
      title: text('Title', 'Content curator', 'Mokhtar'),
      stake: new u128(number('Stake', 10101, {}, 'Mokhtar')),
      workerId: 5,
      group: WorkingGroups.ContentCurators
    }
  ];

  return (
    <ContentCurators workers={members} workerRolesAvailable={boolean('Roles available', true)} />
  );
}
