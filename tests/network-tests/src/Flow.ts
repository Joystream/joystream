import { Api } from './Api'
import { QueryNodeApi } from './QueryNodeApi'

export type FlowProps = { api: Api; env: NodeJS.ProcessEnv; query: QueryNodeApi }
export type Flow = (args: FlowProps) => Promise<void>
