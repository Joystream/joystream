import { FlowArgs } from '../../Flow'
import Debugger from 'debug'
const debug = Debugger('initializeContentDirectory')

export default async function initializeContentDirectory({ api }: FlowArgs): Promise<void> {
  debug('Started')
  await api.initializeContentDirectory()
  debug('Done')
}
