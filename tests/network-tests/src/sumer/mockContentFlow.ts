// import { assert } from 'chai'
// import { ContentId } from '@joystream/types/storage'
// import { registry } from '@joystream/types'

import { FlowProps } from '../Flow'
// import { Utils } from '../utils'
import { extendDebug } from '../Debugger'

export default async function mockContent({ api }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:createMockContent')
  debug('Started')
  // TODO: implement and use new fixtures:
  // create categories with lead
  // pick N member accounts
  // create one channel per member
  // upload V videos per channel (same contentid)
  debug('Done')
}
