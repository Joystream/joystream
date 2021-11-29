import { Config } from '../types'
import { NetworkingService } from '../services/networking'
import { LoggingService } from '../services/logging'
import { StateCacheService } from '../services/cache/StateCacheService'
import { ContentService } from '../services/content/ContentService'
import { Logger } from 'winston'
import fs from 'fs'
import nodeCleanup from 'node-cleanup'
import { AppIntervals } from '../types/app'
import { PublicApiService } from '../services/httpApi/PublicApiService'
import { OperatorApiService } from '../services/httpApi/OperatorApiService'

export class App {
  private config: Config
  private content: ContentService
  private stateCache: StateCacheService
  private networking: NetworkingService
  private publicApi: PublicApiService
  private operatorApi: OperatorApiService | undefined
  private logging: LoggingService
  private logger: Logger
  private intervals: AppIntervals | undefined
  private isStopping = false

  constructor(config: Config) {
    this.config = config
    this.logging = LoggingService.withAppConfig(config)
    this.stateCache = new StateCacheService(config, this.logging)
    this.networking = new NetworkingService(config, this.stateCache, this.logging)
    this.content = new ContentService(config, this.logging, this.networking, this.stateCache)
    this.publicApi = new PublicApiService(config, this.stateCache, this.content, this.logging, this.networking)
    if (this.config.operatorApi) {
      this.operatorApi = new OperatorApiService(config, this, this.logging, this.publicApi)
    }
    this.logger = this.logging.createLogger('App')
  }

  private setIntervals() {
    this.intervals = {
      saveCacheState: setInterval(() => this.stateCache.save(), this.config.intervals.saveCacheState * 1000),
      checkStorageNodeResponseTimes: setInterval(
        () => this.networking.checkActiveStorageNodeEndpoints(),
        this.config.intervals.checkStorageNodeResponseTimes * 1000
      ),
      cacheCleanup: setInterval(() => this.content.cacheCleanup(), this.config.intervals.cacheCleanup * 1000),
    }
  }

  private clearIntervals() {
    if (this.intervals) {
      Object.values(this.intervals).forEach((interval) => clearInterval(interval))
    }
  }

  private checkConfigDir(name: string, path: string): void {
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
  }

  private checkConfigDirectories(): void {
    Object.entries(this.config.directories).forEach(([name, path]) => this.checkConfigDir(name, path))
    if (this.config.logs?.file) {
      this.checkConfigDir('logs.file.path', this.config.logs.file.path)
    }
  }

  public async start(): Promise<void> {
    this.logger.info('Starting the app', { config: this.config })
    try {
      this.checkConfigDirectories()
      this.stateCache.load()
      await this.content.startupInit()
      this.setIntervals()
      this.publicApi.start()
      this.operatorApi?.start()
    } catch (err) {
      this.logger.error('Node initialization failed!', { err })
      process.exit(-1)
    }
    nodeCleanup(this.exitHandler.bind(this))
  }

  public stop(timeoutSec?: number): boolean {
    if (this.isStopping) {
      return false
    }
    this.logger.info(`Stopping the app${timeoutSec ? ` in ${timeoutSec} sec...` : ''}`)
    this.isStopping = true
    if (timeoutSec) {
      setTimeout(() => process.kill(process.pid, 'SIGINT'), timeoutSec * 1000)
    } else {
      process.kill(process.pid, 'SIGINT')
    }

    return true
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
    this.clearIntervals()
    // Stop the http apis
    this.publicApi.stop()
    this.operatorApi?.stop()
    // Save cache
    try {
      this.stateCache.saveSync()
    } catch (err) {
      this.logger.error('Failed to save the cache state on exit!', { err })
    }
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
