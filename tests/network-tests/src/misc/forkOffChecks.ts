import { assert } from 'chai'
import { FlowProps } from '../Flow'
import { extendDebug } from '../Debugger'
import { BN } from 'bn.js'

export default async function assertValues({ api }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:checkingLiveStorageCloningSuccess')
  debug('Started')

  debug('Check that storage values have been successfully cloned into chainspec')
  const nextMemberId = (await api.query.members.nextMemberId()).toBn()
  const nextVideoId = (await api.query.content.nextVideoId()).toBn()

  assert(nextMemberId > new BN(1000), 'next member id')
  assert(nextVideoId > new BN(100), 'next video id')

  debug('Done')
}
