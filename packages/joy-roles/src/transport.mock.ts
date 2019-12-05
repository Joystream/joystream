import { Balance } from '@polkadot/types/interfaces'
import { Text, u128 } from '@polkadot/types'

import { ITransport } from './transport'
import { Transport as TransportBase } from '@polkadot/joy-utils'

import { Actor, Role } from '@joystream/types/roles'
import { Profile } from '@joystream/types/members';

import { WorkingGroupProps, StorageAndDistributionProps } from "./tabs/WorkingGroup"

import { mockProfile } from './mocks'

export class Transport extends TransportBase implements ITransport {

  public roles(): Promise<Array<Role>> {
    return this.promise<Array<Role>>(
      [
        new Role("StorageProvider"),
      ]
    )
  }

  public curationGroup(): Promise<WorkingGroupProps> {
    return this.promise<WorkingGroupProps>({
      rolesAvailable: true,
      members: [
        {
          actor: new Actor({ member_id: 1, account: '5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp' }),
          profile: mockProfile(
            "benholdencrowther",
            'https://www.benholdencrowther.com/wp-content/uploads/2019/03/Hanging_Gardens_of_Babylon.jpg',
          ),
          title: 'Curation lead',
          lead: true,
          stake: new u128(10101),
          earned: new u128(347829),
        },
        {
          actor: new Actor({ member_id: 2, account: '5DfJWGbBAH8hLAg8rcRYZW5BEZbE4BJeCQKoxUeqoyewLSew' }),
          profile: mockProfile("Handle", "bwhm0", "Martin"),
          title: 'Content curator',
          lead: false,
          stake: new u128(10101),
          earned: new u128(347829),
        },
        {
          actor: new Actor({ member_id: 3, account: '5DQqNWRFPruFs9YKheVMqxUbqoXeMzAWfVfcJgzuia7NA3D3' }),
          profile: mockProfile(
            "yourheropaul",
            "https://yhp.io/img/paul.svg",
          ),
          title: 'Content curator',
          lead: false,
          stake: new u128(10101),
          earned: new u128(347829),
        },
        {
          actor: new Actor({ member_id: 2, account: '5GSMNn8Sy8k64mGUWPDafjMZu9bQNX26GujbBQ1LeJpNbrfg' }),
          profile: mockProfile(
            "alex_joystream",
            "https://avatars2.githubusercontent.com/u/153928?s=200&v=4",
          ),
          title: 'Content curator',
          lead: false,
          stake: new u128(10101),
          earned: new u128(347829),
        },
        {
          actor: new Actor({ member_id: 3, account: '5Gn9n7SDJ7VgHqHQWYzkSA4vX6DCmS5TFWdHxikTXp9b4L32' }),
          profile: mockProfile(
            "mokhtar",
            "https://avatars2.githubusercontent.com/u/1621012?s=460&v=4",
          ),
          title: 'Content curator',
          lead: false,
          stake: new u128(10101),
          earned: new u128(347829),
        },
      ]
    })
  }

  public storageGroup(): Promise<StorageAndDistributionProps> {
    return this.promise<StorageAndDistributionProps>(
      {
        balances: new Map<string, Balance>([
          ['5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp', new u128(101)],
        ]),
        memos: new Map<string, Text>([
          ['5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp', new Text("This is a memo")]
        ]),
        profiles: new Map<number, Profile>([
          [1, mockProfile("bwhm0")],
          [2, mockProfile(
            "benholdencrowther",
            "https://www.benholdencrowther.com/wp-content/uploads/2019/03/Hanging_Gardens_of_Babylon.jpg",
          )],
        ]),
        actors: [
          new Actor({ member_id: 1, account: '5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp' }),
          new Actor({ member_id: 2, account: '5DQqNWRFPruFs9YKheVMqxUbqoXeMzAWfVfcJgzuia7NA3D3' }),
        ],
      },
    )
  }
}


