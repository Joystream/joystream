import { ApiWrapper } from '../../utils/apiWrapper'
import tap from 'tap'

export function closeApi(apiWrapper: ApiWrapper) {
  tap.teardown(() => {
    apiWrapper.close()
  })
}
