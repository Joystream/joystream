import { DatabaseManager } from '@joystream/hydra-common'
import {
  MemberMetadata,
  Membership,
  MembershipExternalResource,
  MembershipExternalResourceType,
  Validator,
} from 'query-node/dist/model'

export async function saveValidator(
  store: DatabaseManager,
  member: Membership,
  externalResources: Pick<MembershipExternalResource, 'type' | 'value'>[] = [],
  memberMetadata: MemberMetadata = member.metadata
): Promise<Validator[] | undefined> {
  const newExternalResources = externalResources
    .filter((d) => d.type === MembershipExternalResourceType.DISCORD)
    .map(
      // here is d.type=== MembershipExternalResourceType.VALIDATOR
      ({ type, value }) => {
        return new Validator({
          id: `${memberMetadata.id}-${type}`,
          isValidator: false,
          validatorAccount: value,
          member: member,
          memberMetadata:memberMetadata
        })
      }
    )

  for (const resource of newExternalResources) {
    await store.save<Validator>(resource)
  }

  return newExternalResources
}
