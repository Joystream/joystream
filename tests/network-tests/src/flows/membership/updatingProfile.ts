import { FlowProps } from '../../Flow'
import {
  BuyMembershipHappyCaseFixture,
  MemberProfileData,
  UpdateProfileHappyCaseFixture,
} from '../../fixtures/membership'

import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { generateParamsFromAccountId } from '../../fixtures/membership/utils'
import { MembershipMetadata } from '@joystream/metadata-protobuf'

export default async function updatingProfile({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:member-profile-update')
  debug('Started')
  api.enableDebugTxLogs()

  const updates: MemberProfileData[] = [
    // Partial updates
    // FIXME: Currently handle always need to be provided, see: https://github.com/Joystream/joystream/issues/2503
    {
      handle: 'New handle 1',
      name: 'New name',
    },
    {
      handle: 'New handle 2',
    },
    // Setting metadata to null
    {
      handle: 'New handle 3',
      name: '',
      about: '',
      avatarUri: '',
      externalResources: [
        {
          type: MembershipMetadata.ExternalResource.ResourceType.EMAIL,
          value: 'A@example.com',
        },
      ],
    },
    // Full update
    {
      handle: 'Updated handle',
      name: 'Updated name',
      about: 'Updated about',
      avatarUri: 'https://example.com/updated-avatar.jpg',
      externalResources: [
        {
          type: MembershipMetadata.ExternalResource.ResourceType.EMAIL,
          value: 'B@example.com',
        },
        {
          type: MembershipMetadata.ExternalResource.ResourceType.HYPERLINK,
          value: 'example.com',
        },
      ],
    },
  ]

  const [account] = (await api.createKeyPairs(1)).map(({ key }) => key.address)
  const buyMembershipHappyCaseFixture = new BuyMembershipHappyCaseFixture(api, query, [account])
  await new FixtureRunner(buyMembershipHappyCaseFixture).run()
  const [memberId] = buyMembershipHappyCaseFixture.getCreatedMembers()

  let oldValues: MemberProfileData = generateParamsFromAccountId(account)
  for (const newValues of updates) {
    const context = { account, memberId }
    const updateProfileHappyCaseFixture = new UpdateProfileHappyCaseFixture(api, query, context, oldValues, newValues)

    await new FixtureRunner(updateProfileHappyCaseFixture).runWithQueryNodeChecks()
    oldValues = updateProfileHappyCaseFixture.getExpectedValues()
  }

  debug('Done')
}
