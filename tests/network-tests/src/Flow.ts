import { Api } from './Api'
import { QueryNodeApi } from './QueryNodeApi'

export type FlowArgs = { api: Api; env: NodeJS.ProcessEnv; query: QueryNodeApi }
export type Flow = (args: FlowArgs) => Promise<void>
