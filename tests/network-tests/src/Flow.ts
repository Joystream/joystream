import { Api } from './Api'
import { QueryNodeApi } from './QueryNodeApi'
import { ResourceLocker } from './Resources'
import { CliApi } from './CliApi'

export type FlowProps = {
  api: Api
  env: NodeJS.ProcessEnv
  query: QueryNodeApi
  cli: CliApi
  lock: ResourceLocker
}
export type Flow = (args: FlowProps) => Promise<void>
