import { ApiWrapper } from './apiWrapper'
import tap from 'tap'

export function closeApi(apiWrapper: ApiWrapper) {
  tap.teardown(() => {
    apiWrapper.close()
  })
}
