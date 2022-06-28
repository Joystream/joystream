import { promisify } from 'util'
import fs from 'fs'

export class FSP {
  public static open = promisify(fs.open)
  public static read = promisify(fs.read)
  public static close = promisify(fs.close)
}
