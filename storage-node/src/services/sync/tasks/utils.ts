import _ from 'lodash'
import { hashFile } from 'src/services/helpers/hashing'
import logger from 'src/services/logger'

export async function withRandomUrls(
  operatorUrls: string[],
  callback: (chosenBaseUrl: string) => Promise<void>
): Promise<void> {
  const operatorUrlIndices: number[] = _.shuffle(_.range(operatorUrls.length))

  if (operatorUrlIndices.length === 0) {
    logger.warn(`Sync - No operator URLs provided`)
    return Promise.resolve()
  }

  for (const randomUrlIndex of operatorUrlIndices) {
    const randomUrl = operatorUrls[randomUrlIndex]
    logger.debug(`Sync - random storage node URL was chosen ${randomUrl}`)
    try {
      try {
        await callback(randomUrl)
        return
      } catch (err) {
        continue // try another url in the list
      }
    } catch (err) {
      throw new Error(`Sync - Failed to execute callback with random URLs: ${err}`)
    }
  }
}

/** Compares expected and real IPFS hashes
 *
 * @param filePath downloaded file path
 * @param expectedHash expected hash
 */
export async function verifyFileHash(filePath: string, expectedHash: string): Promise<void> {
  const hash = await hashFile(filePath)

  if (hash !== expectedHash) {
    throw new HashFileVerificationError(expectedHash, hash)
  }
}

export class HashFileVerificationError extends Error {
  constructor(expectedHash: string, realHash: string) {
    super(`Invalid file hash. Expected: ${expectedHash} - real: ${realHash}`)
    this.name = 'HashFileVerificationError'
  }
}
