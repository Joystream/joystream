import { DispatchError } from '@polkadot/types/interfaces/system'
import { ApiPromise } from '@polkadot/api'
import { Event } from '@polkadot/types/interfaces'

export function decodeError(api: ApiPromise, event: Event): string {
  const dispatchError = event.data[0] as DispatchError
  let errorMsg = dispatchError.toString()
  if (dispatchError.isModule) {
    try {
      const { name, docs } = api.registry.findMetaError(dispatchError.asModule)
      errorMsg = `${name} (${docs.join(', ')})`
    } catch (e) {
      // This probably means we don't have this error in the metadata
      // In this case - continue (we'll just display dispatchError.toString())
    }
  }
  return errorMsg
}
