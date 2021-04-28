import { Observable } from 'rxjs';
import { Balance } from '@polkadot/types/interfaces';

import { Subscribable } from '@polkadot/joy-utils/react/helpers';
import MockTransportBase from '@polkadot/joy-utils/transport/mock/base';

import { ITransport } from './transport';

import { createType } from '@joystream/types';

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
          memberId: createType('MemberId', 1),
          roleAccount: createType('AccountId', '5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp'),
          profile: mockProfile(
            'benholdencrowther',
            'https://www.benholdencrowther.com/wp-content/uploads/2019/03/Hanging_Gardens_of_Babylon.jpg'
          ),
          title: 'Content curator',
          stake: createType('Balance', 10101),
          workerId: 1,
          group: WorkingGroups.ContentCurators
        },
        {
          memberId: createType('MemberId', 2),
          roleAccount: createType('AccountId', '5DfJWGbBAH8hLAg8rcRYZW5BEZbE4BJeCQKoxUeqoyewLSew'),
          profile: mockProfile('bwhm0'),
          title: 'Content curator',
          stake: createType('Balance', 10101),
          workerId: 2,
          group: WorkingGroups.ContentCurators
        },
        {
          memberId: createType('MemberId', 3),
          roleAccount: createType('AccountId', '5DQqNWRFPruFs9YKheVMqxUbqoXeMzAWfVfcJgzuia7NA3D3'),
          profile: mockProfile(
            'yourheropaul',
            'https://yhp.io/img/paul.svg'
          ),
          title: 'Content curator',
          stake: createType('Balance', 10101),
          workerId: 3,
          group: WorkingGroups.ContentCurators
        },
        {
          memberId: createType('MemberId', 4),
          roleAccount: createType('AccountId', '5GSMNn8Sy8k64mGUWPDafjMZu9bQNX26GujbBQ1LeJpNbrfg'),
          profile: mockProfile(
            'alex_joystream',
            'https://avatars2.githubusercontent.com/u/153928?s=200&v=4'
          ),
          title: 'Content curator',
          stake: createType('Balance', 10101),
          workerId: 4,
          group: WorkingGroups.ContentCurators
        },
        {
          memberId: createType('MemberId', 3),
          roleAccount: createType('AccountId', '5Gn9n7SDJ7VgHqHQWYzkSA4vX6DCmS5TFWdHxikTXp9b4L32'),
          profile: mockProfile(
            'mokhtar',
            'https://avatars2.githubusercontent.com/u/1621012?s=460&v=4'
          ),
          title: 'Content curator',
          stake: createType('Balance', 10101),
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
          memberId: createType('MemberId', 1),
          roleAccount: createType('AccountId', '5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp'),
          profile: mockProfile(
            'benholdencrowther',
            'https://www.benholdencrowther.com/wp-content/uploads/2019/03/Hanging_Gardens_of_Babylon.jpg'
          ),
          title: 'Storage provider',
          stake: createType('Balance', 10101),
          workerId: 1,
          group: WorkingGroups.StorageProviders
        }
      ]
    });
  }

  groupOverview (group: WorkingGroups): Promise<WorkingGroupMembership> {
    return this.storageGroup();
  }

  currentOpportunities (): Promise<Array<WorkingGroupOpening>> {
    return this.simulateApiResponse<Array<WorkingGroupOpening>>(
      [
        {
          opening: createType('Opening', {
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
              createType('Balance', 500)
            ),
            requiredRoleStake: new RoleStakeRequirement(
              createType('Balance', 0)
            ),
            defactoMinimumStake: createType('Balance', 0)
          },
          defactoMinimumStake: createType('Balance', 0)
        }
      ]
    );
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async groupOpening (group: WorkingGroups, id: number): Promise<WorkingGroupOpening> {
    return this.simulateApiResponse<WorkingGroupOpening>(
      {
        opening: createType('Opening', {
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
            createType('Balance', 501),
            StakeType.AtLeast
          ),
          requiredRoleStake: new RoleStakeRequirement(
            createType('Balance', 502)
          ),
          defactoMinimumStake: createType('Balance', 0)
        },
        defactoMinimumStake: createType('Balance', 0)
      }
    );
  }

  openingApplicationRanks (group: WorkingGroups, openingId: number): Promise<Balance[]> {
    const slots: Balance[] = [];

    for (let i = 0; i < 20; i++) {
      slots.push(createType('Balance', (i * 100) + 10 + i + 1));
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
    return new Observable<keyPairDetails[]>((observer) => {
      observer.next(
        [
          {
            shortName: 'KP1',
            accountId: createType('AccountId', '5HZ6GtaeyxagLynPryM7ZnmLzoWFePKuDrkb4AT8rT4pU1fp'),
            balance: createType('Balance', 23342)
          },
          {
            shortName: 'KP2',
            accountId: createType('AccountId', '5DQqNWRFPruFs9YKheVMqxUbqoXeMzAWfVfcJgzuia7NA3D3'),
            balance: createType('Balance', 993342)
          },
          {
            shortName: 'KP3',
            accountId: createType('AccountId', '5DBaczGTDhcHgwsZzNE5qW15GrQxxdyros4pYkcKrSUovFQ9'),
            balance: createType('Balance', 242)
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
      opening: createType('Opening', {
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
      applicationStake: createType('Balance', 5),
      roleStake: createType('Balance', 15),
      rank: 21,
      capacity: 20
    }];
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async myRoles (address: string): Promise<ActiveRole[]> {
    return [
      {
        workerId: createType('CuratorId', 1),
        name: workerRoleNameByGroup[WorkingGroups.ContentCurators],
        group: WorkingGroups.ContentCurators,
        url: 'some URL',
        reward: createType('Balance', 321),
        stake: createType('Balance', 12343200)
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
