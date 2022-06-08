import { JoystreamCLI } from '../cli/joystream'
import { TmpFileManager } from '../cli/utils'
import { v4 as uuid } from 'uuid'

export async function createJoystreamCli(): Promise<JoystreamCLI> {
  const tmpFileManager = new TmpFileManager()

  // create Joystream CLI
  const joystreamCli = new JoystreamCLI(tmpFileManager)

  // init CLI
  await joystreamCli.init()

  return joystreamCli
}
