import { ApiWrapper } from './apiWrapper'

export function setTestTimeout(apiWrapper: ApiWrapper, durationInBlocks: number) {
  const durationInMillis = apiWrapper.getBlockDuration().muln(durationInBlocks).toNumber()
  // tap.setTimeout(durationInMillis)
}
