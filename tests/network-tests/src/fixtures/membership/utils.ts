import { MembershipMetadata } from '@joystream/metadata-protobuf'
import { Utils } from '../../utils'
import { Bytes } from '@polkadot/types'
import { isSet } from '@joystream/metadata-protobuf/utils'
import { MembershipExternalResource, MembershipExternalResourceType } from '../../graphql/generated/schema'

type MemberCreationParams = {
  root_account: string
  controller_account: string
  handle: string
  name?: string
  about?: string
  avatarUri?: string | null
  externalResources?: MembershipMetadata.IExternalResource[] | null
  metadata: Bytes
  is_founding_member: boolean
}

// Common code for Membership fixtures
export function generateParamsFromAccountId(
  accountId: string,
  isFoundingMember: boolean = false // eslint-disable-line @typescript-eslint/no-inferrable-types
): MemberCreationParams {
  const affix = accountId.substring(0, 14)
  const name = `name${affix}`
  const about = `about${affix}`
  const avatarUri = `https://example.com/${affix}.jpg`
  const externalResources = [
    { type: MembershipMetadata.ExternalResource.ResourceType.HYPERLINK, value: `https://${affix}.com` },
  ]
  const metadataBytes = Utils.metadataToBytes(MembershipMetadata, {
    name,
    about,
    avatarUri,
    externalResources,
  })

  return {
    root_account: accountId,
    controller_account: accountId,
    handle: `handle${accountId.substring(0, 14)}`,
    name,
    about,
    avatarUri,
    externalResources,
    metadata: metadataBytes,
    is_founding_member: isFoundingMember,
  }
}

type QNExternalResource = {
  __typename: 'MembershipExternalResource'
} & Pick<MembershipExternalResource, 'type' | 'value'>
export function asMembershipExternalResource({
  type,
  value,
}: MembershipMetadata.IExternalResource): QNExternalResource | undefined {
  if (isSet(type) && isSet(value)) {
    return {
      __typename: 'MembershipExternalResource',
      type: MembershipMetadata.ExternalResource.ResourceType[type] as MembershipExternalResourceType,
      value,
    }
  }
}
