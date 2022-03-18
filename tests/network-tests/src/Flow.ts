import { Api } from './Api'
import { QueryNodeApi } from './QueryNodeApi'
import { ResourceLocker } from './Resources'

export type FlowProps = {
  api: Api
  env: NodeJS.ProcessEnv
  query: QueryNodeApi
  lock: ResourceLocker
}
export type Flow = (args: FlowProps) => Promise<void>
