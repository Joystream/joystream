import { FlowProps } from '../../Flow'
import Debugger from 'debug'
const debug = Debugger('initializeContentDirectory')

export default async function initializeContentDirectory({ api }: FlowProps): Promise<void> {
  debug('Started')
  await api.initializeContentDirectory()
  debug('Done')
}
