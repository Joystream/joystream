import { Observable } from 'rxjs';
import { Balance } from '@polkadot/types/interfaces';

import { Subscribable } from '@polkadot/joy-utils/react/helpers';
import MockTransportBase from '@polkadot/joy-utils/transport/mock/base';

import { ITransport } from './transport';

import { createMock } from '@joystream/types';

import { WorkingGroupMembership, GroupLeadStatus } from './tabs/WorkingGroup';
import { WorkingGroupOpening } from './tabs/Opportunities';
import { ActiveRole, OpeningApplication } from './tabs/MyRoles';
import { ApplicationStakeRequirement, RoleStakeRequirement, StakeType } from './StakeRequirement';
import { keyPairDetails } from './flows/apply';

import { tomorrow, yesterday, newMockHumanReadableText } from './tabs/Opportunities.stories';
import { OpeningState } from './classifiers';

import * as faker from 'faker';
import { mockProfile, mockStage } from './mocks';
import { WorkingGroups, workerRoleNameByGroup } from './working_groups';

export class Transport extends MockTransportBase implements ITransport {
  groupLeadStatus (group: WorkingGroups = WorkingGroups.ContentCurators): Promise<GroupLeadStatus> {
    return this.simulateApiResponse<GroupLeadStatus>({
      loaded: true
    });
  }

  async curationGroup (): Promise<WorkingGroupMembership> {
    return this.simulateApiResponse<WorkingGroupMembership>({
      leadStatus: await this.groupLeadStatus(),
      workerRolesAvailable: true,
      leadRolesAvailable: false,
      workers: [
        {
          memberId: createMock('MemberId', 1),
          roleAccount: createMock('AccountId', '5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp'),
          profile: mockProfile(
            'benholdencrowther',
            'https://www.benholdencrowther.com/wp-content/uploads/2019/03/Hanging_Gardens_of_Babylon.jpg'
          ),
          title: 'Content curator',
          stake: createMock('u128', 10101),
          workerId: 1,
          group: WorkingGroups.ContentCurators
        },
        {
          memberId: createMock('MemberId', 2),
          roleAccount: createMock('AccountId', '5DfJWGbBAH8hLAg8rcRYZW5BEZbE4BJeCQKoxUeqoyewLSew'),
          profile: mockProfile('bwhm0'),
          title: 'Content curator',
          stake: createMock('u128', 10101),
          workerId: 2,
          group: WorkingGroups.ContentCurators
        },
        {
          memberId: createMock('MemberId', 3),
          roleAccount: createMock('AccountId', '5DQqNWRFPruFs9YKheVMqxUbqoXeMzAWfVfcJgzuia7NA3D3'),
          profile: mockProfile(
            'yourheropaul',
            'https://yhp.io/img/paul.svg'
          ),
          title: 'Content curator',
          stake: createMock('u128', 10101),
          workerId: 3,
          group: WorkingGroups.ContentCurators
        },
        {
          memberId: createMock('MemberId', 4),
          roleAccount: createMock('AccountId', '5GSMNn8Sy8k64mGUWPDafjMZu9bQNX26GujbBQ1LeJpNbrfg'),
          profile: mockProfile(
            'alex_joystream',
            'https://avatars2.githubusercontent.com/u/153928?s=200&v=4'
          ),
          title: 'Content curator',
          stake: createMock('u128', 10101),
          workerId: 4,
          group: WorkingGroups.ContentCurators
        },
        {
          memberId: createMock('MemberId', 3),
          roleAccount: createMock('AccountId', '5Gn9n7SDJ7VgHqHQWYzkSA4vX6DCmS5TFWdHxikTXp9b4L32'),
          profile: mockProfile(
            'mokhtar',
            'https://avatars2.githubusercontent.com/u/1621012?s=460&v=4'
          ),
          title: 'Content curator',
          stake: createMock('u128', 10101),
          workerId: 5,
          group: WorkingGroups.ContentCurators
        }
      ]
    });
  }

  async storageGroup (): Promise<WorkingGroupMembership> {
    return this.simulateApiResponse<WorkingGroupMembership>({
      leadStatus: await this.groupLeadStatus(),
      workerRolesAvailable: true,
      leadRolesAvailable: true,
      workers: [
        {
          memberId: createMock('MemberId', 1),
          roleAccount: createMock('AccountId', '5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp'),
          profile: mockProfile(
            'benholdencrowther',
            'https://www.benholdencrowther.com/wp-content/uploads/2019/03/Hanging_Gardens_of_Babylon.jpg'
          ),
          title: 'Storage provider',
          stake: createMock('u128', 10101),
          workerId: 1,
          group: WorkingGroups.StorageProviders
        }
      ]
    });
  }

  currentOpportunities (): Promise<Array<WorkingGroupOpening>> {
    return this.simulateApiResponse<Array<WorkingGroupOpening>>(
      [
        {
          opening: createMock('Opening', {
            created: 50000,
            stage: mockStage,
            max_review_period_length: 100,
            human_readable_text: newMockHumanReadableText({
              version: 1,
              headline: 'Help us curate awesome content',
              job: {
                title: 'Content curator',
                description: faker.lorem.paragraphs(4)
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
              reward: '10 JOY per block',
              process: {
                details: [
                  'Some custom detail'
                ]
              }
            })
          }),
          meta: {
            id: '1',
            group: WorkingGroups.ContentCurators
          },
          stage: {
            state: OpeningState.AcceptingApplications,
            starting_block: 2956498,
            starting_block_hash: 'somehash',
            starting_time: yesterday(),
            review_end_block: 3956498,
            review_end_time: tomorrow()
          },
          applications: {
            numberOfApplications: 0,
            maxNumberOfApplications: 0,
            requiredApplicationStake: new ApplicationStakeRequirement(
              createMock('u128', 500)
            ),
            requiredRoleStake: new RoleStakeRequirement(
              createMock('u128', 0)
            ),
            defactoMinimumStake: createMock('u128', 0)
          },
          defactoMinimumStake: createMock('u128', 0)
        }
      ]
    );
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async groupOpening (group: WorkingGroups, id: number): Promise<WorkingGroupOpening> {
    return this.simulateApiResponse<WorkingGroupOpening>(
      {
        opening: createMock('Opening', {
          created: 50000,
          stage: mockStage,
          max_review_period_length: 100,
          human_readable_text: newMockHumanReadableText({
            version: 1,
            headline: 'Help us curate awesome content',
            job: {
              title: 'Content curator',
              description: faker.lorem.paragraphs(4)
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
            reward: '10 JOY per block',
            process: {
              details: [
                'Some custom detail'
              ]
            }
          })
        }),
        meta: {
          id: '1',
          group: WorkingGroups.ContentCurators
        },
        stage: {
          state: OpeningState.AcceptingApplications,
          starting_block: 2956498,
          starting_block_hash: 'somehash',
          starting_time: yesterday(),
          review_end_block: 3956498,
          review_end_time: tomorrow()
        },
        applications: {
          numberOfApplications: 0,
          maxNumberOfApplications: 0,
          requiredApplicationStake: new ApplicationStakeRequirement(
            createMock('u128', 501),
            StakeType.AtLeast
          ),
          requiredRoleStake: new RoleStakeRequirement(
            createMock('u128', 502)
          ),
          defactoMinimumStake: createMock('u128', 0)
        },
        defactoMinimumStake: createMock('u128', 0)
      }
    );
  }

  openingApplicationRanks (group: WorkingGroups, openingId: number): Promise<Balance[]> {
    const slots: Balance[] = [];
    for (let i = 0; i < 20; i++) {
      slots.push(createMock('u128', (i * 100) + 10 + i + 1));
    }

    return this.simulateApiResponse<Balance[]>(slots);
  }

  expectedBlockTime (): number {
    return 6;
  }

  blockHash (height: number): Promise<string> {
    return this.promise<string>('somehash');
  }

  blockTimestamp (height: number): Promise<Date> {
    return this.promise<Date>(new Date());
  }

  accounts (): Subscribable<keyPairDetails[]> {
    return new Observable<keyPairDetails[]>(observer => {
      observer.next(
        [
          {
            shortName: 'KP1',
            accountId: createMock('AccountId', '5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp'),
            balance: createMock('u128', 23342)
          },
          {
            shortName: 'KP2',
            accountId: createMock('AccountId', '5DQqNWRFPruFs9YKheVMqxUbqoXeMzAWfVfcJgzuia7NA3D3'),
            balance: createMock('u128', 993342)
          },
          {
            shortName: 'KP3',
            accountId: createMock('AccountId', '5DBaczGTDhcHgwsZzNE5qW15GrQxxdyros4pYkcKrSUovFQ9'),
            balance: createMock('u128', 242)
          }
        ]
      );
    });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async openingApplicationsByAddress (address: string): Promise<OpeningApplication[]> {
    return [{
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
      opening: createMock('Opening', {
        created: 50000,
        stage: mockStage,
        max_review_period_length: 100,
        human_readable_text: newMockHumanReadableText({
          version: 1,
          headline: 'Help us curate awesome content',
          job: {
            title: 'Content curator',
            description: faker.lorem.paragraphs(4)
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
          reward: '10 JOY per block',
          process: {
            details: [
              'Some custom detail'
            ]
          }
        })
      }),
      applicationStake: createMock('u128', 5),
      roleStake: createMock('u128', 15),
      rank: 21,
      capacity: 20
    }];
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async myRoles (address: string): Promise<ActiveRole[]> {
    return [
      {
        workerId: createMock('CuratorId', 1),
        name: workerRoleNameByGroup[WorkingGroups.ContentCurators],
        group: WorkingGroups.ContentCurators,
        url: 'some URL',
        reward: createMock('u128', 321),
        stake: createMock('u128', 12343200)
      }
    ];
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async applyToOpening (
    group: WorkingGroups,
    id: number,
    roleAccountName: string,
    sourceAccount: string,
    appStake: Balance,
    roleStake: Balance,
    applicationText: string): Promise<number> {
    return 0;
  }

  leaveRole (group: WorkingGroups, sourceAccount: string, id: number, rationale: string) {
    /* do nothing */
  }

  withdrawApplication (group: WorkingGroups, sourceAccount: string, id: number) {
    /* do nothing */
  }
}
