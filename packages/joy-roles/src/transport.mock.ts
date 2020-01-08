import { Observable } from 'rxjs';
import { Balance } from '@polkadot/types/interfaces'
import { Text, u128, GenericAccountId } from '@polkadot/types'

import { Subscribable } from '@polkadot/joy-utils/index'

import { ITransport } from './transport'
import { Transport as TransportBase } from '@polkadot/joy-utils/index'

import { Actor, Role } from '@joystream/types/roles'
import { Opening } from "@joystream/types/hiring"
import { Profile } from '@joystream/types/members';

import { WorkingGroupProps, StorageAndDistributionProps } from "./tabs/WorkingGroup"
import { WorkingGroupOpening } from "./tabs/Opportunities"
import { ActiveRole, OpeningApplication } from "./tabs/MyRoles"
import { ApplicationStakeRequirement, RoleStakeRequirement, StakeType } from './StakeRequirement'
import { keyPairDetails } from './flows/apply'

import { tomorrow, yesterday, newMockHumanReadableText } from "./tabs/Opportunities.stories"
import { OpeningState } from "./classifiers"

import * as faker from 'faker'
import { mockProfile } from './mocks'

export class Transport extends TransportBase implements ITransport {
  protected simulateApiResponse<T>(value: T): Promise<T> {
    return this.promise<T>(value, this.randomTimeout())
  }

  protected randomTimeout(min: number = 1, max: number = 20): number {
    return Math.random() * (max - min) + min;
  }

  roles(): Promise<Array<Role>> {
    return this.promise<Array<Role>>(
      [
        new Role("StorageProvider"),
      ]
    )
  }

  curationGroup(): Promise<WorkingGroupProps> {
    return this.simulateApiResponse<WorkingGroupProps>({
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
          profile: mockProfile("bwhm0"),
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

  storageGroup(): Promise<StorageAndDistributionProps> {
    return this.simulateApiResponse<StorageAndDistributionProps>(
      {
        balances: new Map<string, Balance>([
          ['5DfJWGbBAH8hLAg8rcRYZW5BEZbE4BJeCQKoxUeqoyewLSew', new u128(101)],
        ]),
        memos: new Map<string, Text>([
          ['5DfJWGbBAH8hLAg8rcRYZW5BEZbE4BJeCQKoxUeqoyewLSew', new Text("This is a memo")]
        ]),
        profiles: new Map<number, Profile>([
          [1, mockProfile("bwhm0")],
          [2, mockProfile(
            "benholdencrowther",
            "https://www.benholdencrowther.com/wp-content/uploads/2019/03/Hanging_Gardens_of_Babylon.jpg",
          )],
        ]),
        actors: [
          new Actor({ member_id: 1, account: '5DfJWGbBAH8hLAg8rcRYZW5BEZbE4BJeCQKoxUeqoyewLSew' }),
          new Actor({ member_id: 2, account: '5DQqNWRFPruFs9YKheVMqxUbqoXeMzAWfVfcJgzuia7NA3D3' }),
        ],
      },
    )
  }

  currentOpportunities(): Promise<Array<WorkingGroupOpening>> {
    return this.simulateApiResponse<Array<WorkingGroupOpening>>(
      [
        {
          opening: new Opening({
            max_review_period_length: 50000,
            human_readable_text: newMockHumanReadableText({
              version: 1,
              headline: "Help us curate awesome content",
              job: {
                title: "Content curator",
                description: faker.lorem.paragraphs(4),
              },
              application: {
                sections: [
                  {
                    title: "About you",
                    questions: [
                      {
                        title: "your name",
                        type: "text"
                      }
                    ]
                  },
                  {
                    title: "About you",
                    questions: [
                      {
                        title: "your name",
                        type: "text area"
                      }
                    ]
                  }
                ]
              },
              reward: "10 JOY per block",
              creator: {
                membership: {
                  handle: "ben",
                }
              },
              process: {
                details: [
                  "Some custom detail"
                ]
              }
            }),
          }),
          creator: {
            actor: new Actor({ member_id: 1, account: '5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp' }),
            profile: mockProfile('benholdencrowther'),
            title: 'Group lead',
            lead: true,
            stake: new u128(10),
          },
          meta: {
            uri: "https://some.url/#1",
            id: "1",
          },
          stage: {
            state: OpeningState.AcceptingApplications,
            starting_block: 2956498,
            starting_block_hash: "somehash",
            created_time: yesterday(),
            review_end_block: 3956498,
            review_end_time: tomorrow(),
          },
          applications: {
            numberOfApplications: 0,
            maxNumberOfApplications: 0,
            requiredApplicationStake: new ApplicationStakeRequirement(
              new u128(500),
            ),
            requiredRoleStake: new RoleStakeRequirement(
              new u128(0),
            ),
            defactoMinimumStake: new u128(0),
          },
          defactoMinimumStake: new u128(0),
        },
      ],
    )
  }

  opening(id: string): Promise<WorkingGroupOpening> {
    return this.simulateApiResponse<WorkingGroupOpening>(
      {
        opening: new Opening({
          max_review_period_length: 50000,
          human_readable_text: newMockHumanReadableText({
            version: 1,
            headline: "Help us curate awesome content",
            job: {
              title: "Content curator",
              description: faker.lorem.paragraphs(4),
            },
            application: {
              sections: [
                {
                  title: "About you",
                  questions: [
                    {
                      title: "Your name",
                      type: "text"
                    },
                    {
                      title: "Your e-mail address",
                      type: "text"
                    }
                  ]
                },
                {
                  title: "Your experience",
                  questions: [
                    {
                      title: "Why would you be good for this role?",
                      type: "text area"
                    }
                  ]
                }
              ]
            },
            reward: "10 JOY per block",
            creator: {
              membership: {
                handle: "ben",
              }
            },
            process: {
              details: [
                "Some custom detail"
              ]
            }
          }),
        }),
        creator: {
          actor: new Actor({ member_id: 1, account: '5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp' }),
          profile: mockProfile('benholdencrowther'),
          title: 'Group lead',
          lead: true,
          stake: new u128(10),
        },
        meta: {
          uri: "https://some.url/#1",
          id: "1",
        },
        stage: {
          state: OpeningState.AcceptingApplications,
          starting_block: 2956498,
          starting_block_hash: "somehash",
          created_time: yesterday(),
          review_end_block: 3956498,
          review_end_time: tomorrow(),
        },
        applications: {
          numberOfApplications: 0,
          maxNumberOfApplications: 0,
          requiredApplicationStake: new ApplicationStakeRequirement(
            new u128(501),
            StakeType.AtLeast,
          ),
          requiredRoleStake: new RoleStakeRequirement(
            new u128(502),
          ),
          defactoMinimumStake: new u128(0),
        },
        defactoMinimumStake: new u128(0),
      },
    )
  }

  openingApplicationRanks(openingId: string): Promise<Balance[]> {
    const slots: Balance[] = []
    for (let i = 0; i < 20; i++) {
      slots.push(new u128((i * 100) + 10 + i + 1))
    }

    return this.simulateApiResponse<Balance[]>(slots)
  }

  expectedBlockTime(): Promise<number> {
    return this.promise<number>(6)
  }

  transactionFee(): Promise<Balance> {
    return this.simulateApiResponse<Balance>(new u128(5))
  }

  accounts(): Subscribable<keyPairDetails[]> {
    return new Observable<keyPairDetails[]>(observer => {
      observer.next(
        [
          {
            shortName: "KP1",
            accountId: new GenericAccountId('5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp'),
            balance: new u128(23342),
          },
          {
            shortName: "KP2",
            accountId: new GenericAccountId('5DQqNWRFPruFs9YKheVMqxUbqoXeMzAWfVfcJgzuia7NA3D3'),
            balance: new u128(993342),
          },
          {
            shortName: "KP3",
            accountId: new GenericAccountId('5DBaczGTDhcHgwsZzNE5qW15GrQxxdyros4pYkcKrSUovFQ9'),
            balance: new u128(242),
          },
        ]
      )
    })
  }

  openingApplications(): Subscribable<OpeningApplication[]> {
    return new Observable<OpeningApplication[]>(observer => {
      observer.next(
        [
          {
            creator: {
              actor: new Actor({ member_id: 1, account: '5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp' }),
              profile: mockProfile('benholdencrowther'),
              title: 'Group lead',
              lead: true,
              stake: new u128(10),
            },
            meta: {
              uri: "https://some.url/#1",
              id: "1",
            },
            stage: {
              state: OpeningState.AcceptingApplications,
              starting_block: 2956498,
              starting_block_hash: "somehash",
              created_time: yesterday(),
            },
            opening: new Opening({
              max_review_period_length: 50000,
              human_readable_text: newMockHumanReadableText({
                version: 1,
                headline: "Help us curate awesome content",
                job: {
                  title: "Content curator",
                  description: faker.lorem.paragraphs(4),
                },
                application: {
                  sections: [
                    {
                      title: "About you",
                      questions: [
                        {
                          title: "Your name",
                          type: "text"
                        },
                        {
                          title: "Your e-mail address",
                          type: "text"
                        }
                      ]
                    },
                    {
                      title: "Your experience",
                      questions: [
                        {
                          title: "Why would you be good for this role?",
                          type: "text area"
                        }
                      ]
                    }
                  ]
                },
                reward: "10 JOY per block",
                creator: {
                  membership: {
                    handle: "ben",
                  }
                },
                process: {
                  details: [
                    "Some custom detail"
                  ]
                }
              }),
            }),
            applicationStake: new u128(5),
            roleStake: new u128(15),
            rank: 21,
            capacity: 20,
          },
        ]
      )
    }
    )
  }

  myCurationGroupRoles(): Subscribable<ActiveRole[]> {
    return new Observable<ActiveRole[]>(observer => {
      observer.next(
        [
          {
            name: "My curation group role",
            url: "some URL",
            reward: "10 JOY per block",
            stake: new u128(12343200),
          }
        ]
      )
    }
    )
  }

  myStorageGroupRoles(): Subscribable<ActiveRole[]> {
    return new Observable<ActiveRole[]>(observer => {
      observer.next(
        [
          {
            name: "Storage provider",
            url: "some URL",
            reward: "10 JOY per block",
            stake: new u128(12343200),
          }
        ]
      )
    }
    )
  }
}

