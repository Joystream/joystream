import chalk from 'chalk'
import removeEndingForwardSlash from '@joystream/storage-utils/stripEndingSlash'
import { ContentId } from '@joystream/types/storage'
import Debug from 'debug'
const debug = Debug('joystream:storage-cli:base')

// Commands base abstract class. Contains reusable methods.
export abstract class BaseCommand {
  protected readonly api: any

  constructor(api: any) {
    this.api = api
  }

  // Creates the Colossus asset URL and logs it.
  protected createAndLogAssetUrl(url: string, contentId: string | ContentId): string {
    let normalizedContentId: string

    if (typeof contentId === 'string') {
      normalizedContentId = contentId
    } else {
      normalizedContentId = contentId.encode()
    }

    const normalizedUrl = removeEndingForwardSlash(url)
    const assetUrl = `${normalizedUrl}/asset/v0/${normalizedContentId}`
    console.log(chalk.yellow('Generated asset URL:', assetUrl))

    return assetUrl
  }

  // Abstract method to provide parameter validation.
  protected abstract validateParameters(): boolean

  // Abstract method to show command usage.
  protected abstract showUsage()

  // Checks command parameters and shows the usage if necessary.
  protected assertParameters(): boolean {
    // Create, validate and show parameters.
    if (!this.validateParameters()) {
      console.log(chalk.yellow(`Invalid parameters for the command:`))
      this.showUsage()

      return false
    }

    return true
  }

  // Shows the error message and ends the process with error code.
  protected fail(message: string): void {
    console.log(chalk.red(message))
    process.exit(1)
  }

  protected maxContentSize(): number {
    // Maximum content length for the assets (files)
    return 2000 * 1024 * 1024
  }

  // Requests the runtime and obtains the storage node endpoint URL.
  protected async getStorageProviderEndpoint(storageProviderId: string): Promise<string> {
    try {
      const endpoint = await this.api.workers.getWorkerStorageValue(storageProviderId)

      debug(`Resolved endpoint: ${endpoint}`)

      return endpoint
    } catch (err) {
      this.fail(`Could not get provider endpoint: ${err}`)
    }
  }

  protected async getAnyProviderEndpoint(): Promise<string> {
    try {
      const providers = await this.api.workers.getAllProviders()

      debug(`Available Providers: ${providers}`)
      // select first provider
      do {
        const id = providers.ids.pop()
        const endpoint = await this.getStorageProviderEndpoint(id)
        if (endpoint) {
          return endpoint
        }
      } while (providers.ids.length)
      throw new Error('No Providers registered endpoint')
    } catch (err) {
      this.fail(`Could not get provider endpoint: ${err}`)
    }
  }
}
