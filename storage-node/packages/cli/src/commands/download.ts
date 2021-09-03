import axios from 'axios'
import chalk from 'chalk'
import fs from 'fs'
import { BaseCommand } from './base'

// Download command class. Validates input parameters and execute the logic for asset downloading.
export class DownloadCommand extends BaseCommand {
  private readonly contentId: string
  private readonly outputFilePath: string

  constructor(api: any, contentId: string, outputFilePath: string) {
    super(api)

    this.contentId = contentId
    this.outputFilePath = outputFilePath
  }

  // Provides parameter validation. Overrides the abstract method from the base class.
  protected validateParameters(): boolean {
    return this.contentId && this.contentId !== '' && this.outputFilePath && this.outputFilePath !== ''
  }

  // Shows command usage. Overrides the abstract method from the base class.
  protected showUsage() {
    console.log(
      chalk.yellow(`
        Usage:   storage-cli download contentID filePath
        Example: storage-cli download 5Ec3PL3wbutqvDykhNxXJFEWSdw9rS4LBsGUXH9gSusFzc5X ./movie.mp4
      `)
    )
  }

  // Command executor.
  async run(): Promise<void> {
    // Checks for input parameters, shows usage if they are invalid.
    if (!this.assertParameters()) return

    const storageNodeUrl = await this.getAnyProviderEndpoint()

    const assetUrl = this.createAndLogAssetUrl(storageNodeUrl, this.contentId)
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
        // max length of response
        maxContentLength: this.maxContentSize(),
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
