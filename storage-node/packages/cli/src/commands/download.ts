import axios from 'axios'
import chalk from 'chalk'
import fs from 'fs'
import { BaseCommand } from './base'

// Download command class. Validates input parameters and execute the logic for asset downloading.
export class DownloadCommand extends BaseCommand {
  private readonly api: any
  private readonly storageNodeUrl: string
  private readonly contentId: string
  private readonly outputFilePath: string

  constructor(api: any, storageNodeUrl: string, contentId: string, outputFilePath: string) {
    super()

    this.api = api
    this.storageNodeUrl = storageNodeUrl
    this.contentId = contentId
    this.outputFilePath = outputFilePath
  }

  // Provides parameter validation. Overrides the abstract method from the base class.
  protected validateParameters(): boolean {
    return (
      this.storageNodeUrl &&
      this.storageNodeUrl !== '' &&
      this.contentId &&
      this.contentId !== '' &&
      this.outputFilePath &&
      this.outputFilePath !== ''
    )
  }

  // Shows command usage. Overrides the abstract method from the base class.
  protected showUsage() {
    console.log(
      chalk.yellow(`
        Usage:   storage-cli download colossusURL contentID filePath
        Example: storage-cli download http://localhost:3001 0x7a6ba7e9157e5fba190dc146fe1baa8180e29728a5c76779ed99655500cff795 ./movie.mp4
      `)
    )
  }

  // Command executor.
  async run() {
    // Checks for input parameters, shows usage if they are invalid.
    if (!this.assertParameters()) return

    const assetUrl = this.createAndLogAssetUrl(this.storageNodeUrl, this.contentId)
    console.log(chalk.yellow('File path:', this.outputFilePath))

    // Create file write stream and set error handler.
    const writer = fs.createWriteStream(this.outputFilePath).on('error', (err) => {
      this.fail(`File write failed: ${err}`)
    })

    // Request file download.
    try {
      const response = await axios({
        url: assetUrl,
        method: 'GET',
        responseType: 'stream',
      })

      response.data.pipe(writer)

      return new Promise((resolve) => {
        writer.on('finish', () => {
          console.log('File downloaded.')
          resolve()
        })
      })
    } catch (err) {
      this.fail(`Colossus request failed: ${err.message}`)
    }
  }
}
