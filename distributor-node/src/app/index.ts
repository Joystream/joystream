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
        throw new Error(`${dirInfo} doesn't exists!`)
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
    this.checkConfigDirectories()
    this.stateCache.load()
    const dataObjects = await this.networking.fetchSupportedDataObjects()
    // TODO: Try to actually save as much content as possible by downloading missing data
    await this.content.startupSync(dataObjects)
    this.server.start()
    nodeCleanup(this.exitHandler.bind(this))
  }

  private async exitGracefully(): Promise<void> {
    this.logger.info('Graceful exit initialized')
    // Async exit handler - ideally should not take more than 10 sec
    // We can try to wait until some pending downloads are finished here etc.
    await this.stateCache.save()
    this.logger.info('Graceful exit succesful')
  }

  private exitCritically(): void {
    this.logger.info('Critical exit initialized')
    // Handling exits due to an error - only some critical, synchronous work can be done here
    this.stateCache.saveSync()
    this.logger.close()
    this.logger.info('Critical exit succesful')
  }

  private exitHandler(exitCode: number | null, signal: string | null): boolean | undefined {
    this.logger.info('Exiting')
    this.stateCache.clearInterval()
    if (signal) {
      // Async exit can be executed
      this.exitGracefully()
        .then(() => {
          this.logger.close()
          process.kill(process.pid, signal)
        })
        .catch((err) => {
          this.logger.error('Graceful exit error', { err })
          this.logger.close()
          process.kill(process.pid, signal)
        })
      nodeCleanup.uninstall()
      return false
    } else {
      // Only synchronous work can be done here
      this.exitCritically()
    }
  }
}
