import { DatabaseManager } from '@joystream/hydra-common'
import {
  MemberMetadata,
  Membership,
  Validator,
} from 'query-node/dist/model'

export async function saveValidator(
  store: DatabaseManager,
  member: Membership,
  memberMetadata: MemberMetadata = member.metadata,
): Promise<void>  {
        const validator =  new Validator({
          id: `${memberMetadata.id}`,
          isVerified: false,
          // validatorAccount: memberMetadata.validatormemberMetadata,
          member: member,
          memberMetadata:memberMetadata

        })
        await store.save<Validator>(validator)

}
