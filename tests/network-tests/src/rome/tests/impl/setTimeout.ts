import tap from 'tap'
import { ApiWrapper } from '../../utils/apiWrapper'
import { WsProvider } from '@polkadot/api'
import { registerJoystreamTypes } from '@rome/types'

export function setTimeout(nodeUrl: string, durationInBlocks: number) {
  let apiWrapper: ApiWrapper
  registerJoystreamTypes()

  tap.test('retrieving time necessary for the test', async () => {
    const provider = new WsProvider(nodeUrl)
    apiWrapper = await ApiWrapper.create(provider)
    const durationInMillis = (await apiWrapper.getBlockDuration()).muln(durationInBlocks).toNumber()
    tap.setTimeout(durationInMillis)
  })

  tap.teardown(() => {
    apiWrapper.close()
  })
}
