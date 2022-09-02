import { assert } from 'chai'
import { Api } from '../../../Api'
import { BaseQueryNodeFixture } from '../../../Fixture'
import { QueryNodeApi } from '../../../QueryNodeApi'
import { JoystreamCLI } from '../../../cli/joystream'
import { ChannelUpdateInputParameters } from '@joystream/cli/src/Types'
import { assertCuratorCollaboratorPermissions } from './utils'

export class UpdateChannelCollaboratorsFixture extends BaseQueryNodeFixture {
  private cli: JoystreamCLI
  private channelId: number
  private expectedInitialCollaborators: NonNullable<ChannelUpdateInputParameters['collaborators']>
  private collaborators: NonNullable<ChannelUpdateInputParameters['collaborators']>

  constructor(
    api: Api,
    query: QueryNodeApi,
    cli: JoystreamCLI,
    channelId: number,
    expectedInitialCollaborators: NonNullable<ChannelUpdateInputParameters['collaborators']>,
    collaborators: NonNullable<ChannelUpdateInputParameters['collaborators']>
  ) {
    super(api, query)
    this.cli = cli
    this.channelId = channelId
    this.expectedInitialCollaborators = expectedInitialCollaborators
    this.collaborators = collaborators
  }

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    this.debug('Checking initial collaborators permissions')
    await this.assertCollaborators(this.expectedInitialCollaborators)

    this.debug('Updating channel collaborators')
    await this.cli.updateChannel(this.channelId, {
      collaborators: this.collaborators,
    })

    this.debug('Checking new collaborators permissions')
    await this.assertCollaborators(this.collaborators)
  }

  async assertCollaborators(
    expectedCollaborators: NonNullable<ChannelUpdateInputParameters['collaborators']>
  ): Promise<void> {
    await this.query.tryQueryWithTimeout(
      () => this.query.getCollaboratorsByChannelId(this.channelId.toString()),
      (collaborators) => {
        assert.equal(collaborators.length, expectedCollaborators.length)

        for (const [index, collaborator] of collaborators.entries()) {
          assertCuratorCollaboratorPermissions(expectedCollaborators[index].permissions, collaborator.permissions)
        }
      }
    )
  }
}
