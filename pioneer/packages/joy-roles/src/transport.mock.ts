import { Observable } from 'rxjs';
import { Balance } from '@polkadot/types/interfaces'
import { Option, Text, u32, u128, GenericAccountId } from '@polkadot/types'

import { Subscribable } from '@polkadot/joy-utils/index'

import { ITransport } from './transport'
import { Transport as TransportBase } from '@polkadot/joy-utils/index'

import { Actor, Role } from '@joystream/types/roles'
import {
  Opening,
  AcceptingApplications,
  ActiveOpeningStage,
  ApplicationRationingPolicy,
  StakingPolicy,
} from "@joystream/types/hiring"
import { IProfile, MemberId } from '@joystream/types/members';

import { WorkingGroupMembership, StorageAndDistributionMembership, GroupLeadStatus } from "./tabs/WorkingGroup"
import { CuratorId } from '@joystream/types/content-working-group';
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

  groupLeadStatus(): Promise<GroupLeadStatus> {
    return this.simulateApiResponse<GroupLeadStatus>({
      loaded: true
    });
  }

  curationGroup(): Promise<WorkingGroupMembership> {
    return this.simulateApiResponse<WorkingGroupMembership>({
      rolesAvailable: true,
      members: [
        {
          memberId: new MemberId(1),
          roleAccount: new GenericAccountId('5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp'),
          profile: mockProfile(
            "benholdencrowther",
            'https://www.benholdencrowther.com/wp-content/uploads/2019/03/Hanging_Gardens_of_Babylon.jpg',
          ),
          title: 'Content curator',
          stake: new u128(10101),
          earned: new u128(347829),
        },
        {
          memberId: new MemberId(2),
          roleAccount: new GenericAccountId('5DfJWGbBAH8hLAg8rcRYZW5BEZbE4BJeCQKoxUeqoyewLSew'),
          profile: mockProfile("bwhm0"),
          title: 'Content curator',
          stake: new u128(10101),
          earned: new u128(347829),
        },
        {
          memberId: new MemberId(3),
          roleAccount: new GenericAccountId('5DQqNWRFPruFs9YKheVMqxUbqoXeMzAWfVfcJgzuia7NA3D3'),
          profile: mockProfile(
            "yourheropaul",
            "https://yhp.io/img/paul.svg",
          ),
          title: 'Content curator',
          stake: new u128(10101),
          earned: new u128(347829),
        },
        {
          memberId: new MemberId(4),
          roleAccount: new GenericAccountId('5GSMNn8Sy8k64mGUWPDafjMZu9bQNX26GujbBQ1LeJpNbrfg'),
          profile: mockProfile(
            "alex_joystream",
            "https://avatars2.githubusercontent.com/u/153928?s=200&v=4",
          ),
          title: 'Content curator',
          stake: new u128(10101),
          earned: new u128(347829),
        },
        {
          memberId: new MemberId(3),
          roleAccount: new GenericAccountId('5Gn9n7SDJ7VgHqHQWYzkSA4vX6DCmS5TFWdHxikTXp9b4L32'),
          profile: mockProfile(
            "mokhtar",
            "https://avatars2.githubusercontent.com/u/1621012?s=460&v=4",
          ),
          title: 'Content curator',
          stake: new u128(10101),
          earned: new u128(347829),
        },
      ]
    })
  }

  storageGroup(): Promise<StorageAndDistributionMembership> {
    return this.simulateApiResponse<StorageAndDistributionMembership>(
      {
        balances: new Map<string, Balance>([
          ['5DfJWGbBAH8hLAg8rcRYZW5BEZbE4BJeCQKoxUeqoyewLSew', new u128(101)],
        ]),
        memos: new Map<string, Text>([
          ['5DfJWGbBAH8hLAg8rcRYZW5BEZbE4BJeCQKoxUeqoyewLSew', new Text("This is a memo")]
        ]),
        profiles: new Map<number, IProfile>([
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
            created: new u32(50000),
            stage: new ActiveOpeningStage({
              acceptingApplications: new AcceptingApplications({
                started_accepting_applicants_at_block: new u32(100),
              })
            }),
            max_review_period_length: new u32(100),
            application_rationing_policy: new Option(ApplicationRationingPolicy),
            application_staking_policy: new Option(StakingPolicy),
            role_staking_policy: new Option(StakingPolicy),
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
              process: {
                details: [
                  "Some custom detail"
                ]
              }
            }),
          }),
          meta: {
            id: "1",
            group: "somegroup",
          },
          stage: {
            state: OpeningState.AcceptingApplications,
            starting_block: 2956498,
            starting_block_hash: "somehash",
            starting_time: yesterday(),
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

  curationGroupOpening(id: number): Promise<WorkingGroupOpening> {
    return this.simulateApiResponse<WorkingGroupOpening>(
      {
        opening: new Opening({
          created: new u32(50000),
          stage: new ActiveOpeningStage({
            acceptingApplications: new AcceptingApplications({
              started_accepting_applicants_at_block: new u32(100),
            })
          }),
          max_review_period_length: new u32(100),
          application_rationing_policy: new Option(ApplicationRationingPolicy),
          application_staking_policy: new Option(StakingPolicy),
          role_staking_policy: new Option(StakingPolicy),
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
            process: {
              details: [
                "Some custom detail"
              ]
            }
          }),
        }),
        meta: {
          id: "1",
          group: "group-name",
        },
        stage: {
          state: OpeningState.AcceptingApplications,
          starting_block: 2956498,
          starting_block_hash: "somehash",
          starting_time: yesterday(),
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

  openingApplicationRanks(openingId: number): Promise<Balance[]> {
    const slots: Balance[] = []
    for (let i = 0; i < 20; i++) {
      slots.push(new u128((i * 100) + 10 + i + 1))
    }

    return this.simulateApiResponse<Balance[]>(slots)
  }

  expectedBlockTime(): Promise<number> {
    return this.promise<number>(6)
  }

  blockHash(height: number): Promise<string> {
    return this.promise<string>('somehash')
  }

  blockTimestamp(height: number): Promise<Date> {
    return this.promise<Date>(new Date())
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

  async openingApplications(): Promise<OpeningApplication[]> {
    return [{
      id: 1,
      meta: {
        id: "1",
        group: "group-name",
      },
      stage: {
        state: OpeningState.AcceptingApplications,
        starting_block: 2956498,
        starting_block_hash: "somehash",
        starting_time: yesterday(),
      },
      opening: new Opening({
        created: new u32(50000),
        stage: new ActiveOpeningStage({
          acceptingApplications: new AcceptingApplications({
            started_accepting_applicants_at_block: new u32(100),
          })
        }),
        max_review_period_length: new u32(100),
        application_rationing_policy: new Option(ApplicationRationingPolicy),
        application_staking_policy: new Option(StakingPolicy),
        role_staking_policy: new Option(StakingPolicy),
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
    }]
  }

  async myCurationGroupRoles(): Promise<ActiveRole[]> {
    return [
      {
        curatorId: new CuratorId(1),
        name: "My curation group role",
        url: "some URL",
        reward: new u128(321),
        stake: new u128(12343200),
      }
    ]
  }

  myStorageGroupRoles(): Subscribable<ActiveRole[]> {
    return new Observable<ActiveRole[]>(observer => { })
  }

  async applyToCuratorOpening(
    id: number,
    roleAccountName: string,
    sourceAccount: string,
    appStake: Balance,
    roleStake: Balance,
    applicationText: string): Promise<number> {
    return 0
  }

  leaveCurationRole(sourceAccount: string, id: number, rationale: string) {
  }

  withdrawCuratorApplication(sourceAccount: string, id: number) {
  }
}

