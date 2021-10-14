import createApi from './api'
import { ApiPromise } from '@polkadot/api'
import { MemberId, Membership } from '@joystream/sumer-types/augment/all'
import { BlockHash } from '@polkadot/types/interfaces'
import { MemberJson } from '../types'
import fs from 'fs'
import path from 'path'

async function main() {
  const api = await createApi()
  const blockNumner = parseInt(process.env.AT_BLOCK_NUMBER || '')
  const hash = process.env.AT_BLOCK_NUMBER ? await api.rpc.chain.getBlockHash(blockNumner) : undefined

  if (!hash) {
    console.warn('No AT_BLOCK_NUMBER was specified! Exporting from current block...')
  }

  const members = await getAllMembers(api, hash)

  fs.writeFileSync(path.resolve(__dirname, '../data/members.json'), JSON.stringify(members, undefined, 4))
  console.log(`${members.length} members exported & saved!`)

  await api.disconnect()
}

async function getAllMembers(api: ApiPromise, hash?: BlockHash): Promise<any[]> {
  const memberStorageEntries = hash
    ? await api.query.members.membershipById.entriesAt(hash)
    : await api.query.members.membershipById.entries()
  const memberEntries: [MemberId, Membership][] = memberStorageEntries.map(([{ args: [memberId] }, member]) => [
    memberId,
    member,
  ])
  const members: MemberJson[] = memberEntries.map(([memberId, member]) => ({
    memberId: memberId.toString(),
    rootAccount: member.root_account.toString(),
    controllerAccount: member.controller_account.toString(),
    handle: member.handle.toString(),
    avatarUri: member.avatar_uri.toString(),
    about: member.about.toString(),
    registeredAtTime: member.registered_at_time.toNumber(),
  }))

  return members
}

main()
  .then(() => process.exit())
  .catch(console.error)
