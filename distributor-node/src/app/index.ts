import { ReadonlyConfig } from '../types'
import { NetworkingService } from '../services/networking'
import { LoggingService } from '../services/logging'
import { StateCacheService } from '../services/cache/StateCacheService'
import { ContentService } from '../services/content/ContentService'
import { ServerService } from '../services/server/ServerService'
import { Logger } from 'winston'
import fs from 'fs'
import nodeCleanup from 'node-cleanup'

export class App {
  private config: ReadonlyConfig
  private content: ContentService
  private stateCache: StateCacheService
  private networking: NetworkingService
  private server: ServerService
  private logging: LoggingService
  private logger: Logger

  constructor(config: ReadonlyConfig) {
    this.config = config
    this.logging = LoggingService.withAppConfig(config)
    this.stateCache = new StateCacheService(config, this.logging)
    this.content = new ContentService(config, this.logging, this.stateCache)
    this.networking = new NetworkingService(config, this.stateCache, this.logging)
    this.server = new ServerService(config, this.stateCache, this.content, this.logging, this.networking)
    this.logger = this.logging.createLogger('App')
  }

  private checkConfigDirectories(): void {
    Object.entries(this.config.directories).forEach(([name, path]) => {
      const dirInfo = `${name} directory (${path})`
      if (!fs.existsSync(path)) {
        try {
          fs.mkdirSync(path, { recursive: true })
        } catch (e) {
          throw new Error(`${dirInfo} doesn't exist and cannot be created!`)
        }
      }
      try {
        fs.accessSync(path, fs.constants.R_OK)
      } catch (e) {
        throw new Error(`${dirInfo} is not readable`)
      }
      try {
        fs.accessSync(path, fs.constants.W_OK)
      } catch (e) {
        throw new Error(`${dirInfo} is not writable`)
      }
    })
  }

  public async start(): Promise<void> {
    this.logger.info('Starting the app')
    try {
      this.checkConfigDirectories()
      this.stateCache.load()
      const dataObjects = await this.networking.fetchSupportedDataObjects()
      await this.content.startupInit(dataObjects)
      this.server.start()
    } catch (err) {
      this.logger.error('Node initialization failed!', { err })
      process.exit(-1)
    }
    nodeCleanup(this.exitHandler.bind(this))
  }

  private async exitGracefully(): Promise<void> {
    // Async exit handler - ideally should not take more than 10 sec
    // We can try to wait until some pending downloads are finished here etc.
    this.logger.info('Graceful exit initialized')

    // Try to process remaining downloads
    const MAX_RETRY_ATTEMPTS = 3
    let retryCounter = 0
    while (retryCounter < MAX_RETRY_ATTEMPTS && this.stateCache.getPendingDownloadsCount()) {
      const pendingDownloadsCount = this.stateCache.getPendingDownloadsCount()
      this.logger.info(`${pendingDownloadsCount} pending downloads in progress... Retrying exit in 5 sec...`, {
        retryCounter,
        pendingDownloadsCount,
      })
      await new Promise((resolve) => setTimeout(resolve, 5000))
      this.stateCache.saveSync()
      ++retryCounter
    }

    if (this.stateCache.getPendingDownloadsCount()) {
      this.logger.warn('Limit reached: Could not finish all pending downloads.', {
        pendingDownloadsCount: this.stateCache.getPendingDownloadsCount(),
      })
    }

    this.logger.info('Graceful exit finished')
    await this.logging.end()
  }

  private exitCritically(): void {
    // Some additional synchronous work if required...
    this.logger.info('Critical exit finished')
  }

  private exitHandler(exitCode: number | null, signal: string | null): boolean | undefined {
    this.logger.info('Exiting...')
    // Clear intervals
    this.stateCache.clearInterval()
    this.networking.clearIntervals()
    // Stop the server
    this.server.stop()
    // Save cache
    this.stateCache.saveSync()
    if (signal) {
      // Async exit can be executed
      this.exitGracefully()
        .then(() => {
          process.kill(process.pid, signal)
        })
        .catch((err) => {
          this.logger.error('Graceful exit error', { err })
          this.logging.end().finally(() => {
            process.kill(process.pid, signal)
          })
        })
      nodeCleanup.uninstall()
      return false
    } else {
      // Only synchronous work can be done here
      this.exitCritically()
    }
  }
}
