import fs from 'fs'
import path from 'path'
import { CLIError } from '@oclif/errors'
import { Keyring } from '@polkadot/keyring'
import { KeyringPair } from '@polkadot/keyring/types'

//TODO:
const DefaultExitCode = 12

export function getAccountFromJsonFile(
  jsonBackupFilePath: string
): KeyringPair {
  if (!fs.existsSync(jsonBackupFilePath)) {
    throw new CLIError('Input file does not exist!', { exit: DefaultExitCode })
  }
  if (path.extname(jsonBackupFilePath) !== '.json') {
    throw new CLIError('Invalid input file: File extension should be .json', {
      exit: DefaultExitCode,
    })
  }
  let accountJsonObj: any
  try {
    const accountJson = fs.readFileSync(jsonBackupFilePath)
    accountJsonObj = JSON.parse(accountJson.toString())
  } catch (e) {
    throw new CLIError(
      'Provided backup file is not valid or cannot be accessed',
      { exit: DefaultExitCode }
    )
  }
  if (typeof accountJsonObj !== 'object' || accountJsonObj === null) {
    throw new CLIError('Provided backup file is not valid', {
      exit: DefaultExitCode,
    })
  }

  const keyring = new Keyring()
  let account: KeyringPair
  try {
    // Try adding and retrieving the keys in order to validate that the backup file is correct
    keyring.addFromJson(accountJsonObj)
    account = keyring.getPair(accountJsonObj.address)
  } catch (e) {
    throw new CLIError('Provided backup file is not valid', {
      exit: DefaultExitCode,
    })
  }

  return account
}
