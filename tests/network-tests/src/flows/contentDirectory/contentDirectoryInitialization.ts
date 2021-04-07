import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
const debug = extendDebug('initializeContentDirectory')

export default async function initializeContentDirectory({ api }: FlowProps): Promise<void> {
  debug('Started')
  await api.initializeContentDirectory()
  debug('Done')
}
