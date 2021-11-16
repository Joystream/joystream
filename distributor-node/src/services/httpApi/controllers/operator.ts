import { Logger } from 'winston'
import * as express from 'express'
import { PublicApiService } from '../PublicApiService'
import { LoggingService } from '../../logging'
import { App } from '../../../app'
import { Config, SetBucketsOperation, SetWorkerOperation } from '../../../types'
import { ParamsDictionary } from 'express-serve-static-core'

export class OperatorApiController {
  private config: Config
  private app: App
  private publicApi: PublicApiService
  private logger: Logger

  public constructor(config: Config, app: App, publicApi: PublicApiService, logging: LoggingService) {
    this.config = config
    this.app = app
    this.publicApi = publicApi
    this.logger = logging.createLogger('OperatorApiController')
  }

  public async stopApi(req: express.Request, res: express.Response): Promise<void> {
    this.logger.info(`Stopping public api on operator request from ${req.ip}`, { ip: req.ip })
    const stopped = this.publicApi.stop()
    if (!stopped) {
      res.status(409).json({ message: 'Already stopped' })
    }
    res.status(200).send()
  }

  public async startApi(req: express.Request, res: express.Response): Promise<void> {
    this.logger.info(`Starting public api on operator request from ${req.ip}`, { ip: req.ip })
    const started = this.publicApi.start()
    if (!started) {
      res.status(409).json({ message: 'Already started' })
    }
    res.status(200).send()
  }

  public async shutdown(req: express.Request, res: express.Response): Promise<void> {
    this.logger.info(`Shutting down the app on operator request from ${req.ip}`, { ip: req.ip })
    const shutdown = this.app.stop(5)
    if (!shutdown) {
      res.status(409).json({ message: 'Already shutting down' })
    }
    res.status(200).send()
  }

  public async setWorker(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    req: express.Request<ParamsDictionary, any, SetWorkerOperation>,
    res: express.Response
  ): Promise<void> {
    const { workerId } = req.body
    this.logger.info(`Updating workerId to ${workerId} on operator request from ${req.ip}`, {
      workerId,
      ip: req.ip,
    })
    this.config.workerId = workerId
    res.status(200).send()
  }

  public async setBuckets(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    req: express.Request<ParamsDictionary, any, SetBucketsOperation>,
    res: express.Response
  ): Promise<void> {
    const { buckets } = req.body
    this.logger.info(
      `Updating buckets to ${buckets ? JSON.stringify(buckets) : '"all"'} on operator request from ${req.ip}`,
      {
        buckets,
        ip: req.ip,
      }
    )
    this.config.buckets = buckets
    res.status(200).send()
  }
}
