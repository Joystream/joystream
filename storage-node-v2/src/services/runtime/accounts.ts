import fs from 'fs'
import path from 'path'
import { CLIError } from '@oclif/errors'
import { Keyring } from '@polkadot/keyring'
import { KeyringPair, KeyringPair$Json } from '@polkadot/keyring/types'
import ExitCodes from '../../command-base/ExitCodes'

/**
 * Parses the JSON file with account data and KeyPair instance.
 *
 * @param jsonBackupFilePath - JSON-file path
 * @returns KeyPair instance.
 */
export function getAccountFromJsonFile(jsonBackupFilePath: string): KeyringPair {
  if (!fs.existsSync(jsonBackupFilePath)) {
    throw new CLIError('Input file does not exist!', {
      exit: ExitCodes.FileError,
    })
  }
  if (path.extname(jsonBackupFilePath) !== '.json') {
    throw new CLIError('Invalid input file: File extension should be .json', {
      exit: ExitCodes.FileError,
    })
  }
  let accountJsonObj: KeyringPair$Json
  try {
    const accountJson = fs.readFileSync(jsonBackupFilePath)
    accountJsonObj = JSON.parse(accountJson.toString())
  } catch (e) {
    throw new CLIError('Provided backup file is not valid or cannot be accessed', { exit: ExitCodes.FileError })
  }
  if (typeof accountJsonObj !== 'object' || accountJsonObj === null) {
    throw new CLIError('Provided backup file is not valid', {
      exit: ExitCodes.FileError,
    })
  }

  const keyring = configureKeyring()
  let account: KeyringPair
  try {
    // Try adding and retrieving the keys in order to validate that the backup file is correct
    keyring.addFromJson(accountJsonObj)
    account = keyring.getPair(accountJsonObj.address)
  } catch (e) {
    throw new CLIError('Provided backup file is not valid', {
      exit: ExitCodes.FileError,
    })
  }

  return account
}

/**
 * Returns 'Alice' KeyPair instance.
 *
 * @remarks
 * This method should be used in the development mode only.
 *
 * @returns 'Alice' KeyPair instance.
 */
export function getAlicePair(): KeyringPair {
  const keyring = configureKeyring()
  return keyring.addFromUri('//Alice')
}

/**
 * Create KeyPair instance from the account URI.
 *
 * @param accountURI - account URI (//Alice)
 * @returns KeyPair instance.
 */
export function getAccountFromUri(accountURI: string): KeyringPair {
  const keyring = configureKeyring()
  return keyring.addFromUri(accountURI)
}

/**
 * Configures the Keyring with the proper account type.
 *
 * @returns configured Keyring.
 */
function configureKeyring(): Keyring {
  return new Keyring({ type: 'sr25519' })
}
