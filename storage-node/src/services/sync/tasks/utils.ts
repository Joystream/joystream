import _ from 'lodash'
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
