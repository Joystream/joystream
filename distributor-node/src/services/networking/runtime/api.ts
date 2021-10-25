import { types } from '@joystream/types/'
import { ApiPromise, WsProvider, SubmittableResult } from '@polkadot/api'
import { SubmittableExtrinsic, AugmentedEvent } from '@polkadot/api/types'
import { KeyringPair } from '@polkadot/keyring/types'
import { Balance } from '@polkadot/types/interfaces'
import { formatBalance } from '@polkadot/util'
import { IEvent } from '@polkadot/types/types'
import { DispatchError } from '@polkadot/types/interfaces/system'
import { LoggingService } from '../../logging'
import { Logger } from 'winston'

export class ExtrinsicFailedError extends Error {}

export class RuntimeApi {
  private _api: ApiPromise
  private logger: Logger

  public isDevelopment = false

  private constructor(logging: LoggingService, originalApi: ApiPromise, isDevelopment: boolean) {
    this.isDevelopment = isDevelopment
    this.logger = logging.createLogger('SubstrateApi')
    this._api = originalApi
  }

  static async create(
    logging: LoggingService,
    apiUri: string,
    metadataCache?: Record<string, any>
  ): Promise<RuntimeApi> {
    const { api, chainType } = await RuntimeApi.initApi(apiUri, metadataCache)
    return new RuntimeApi(logging, api, chainType.isDevelopment || chainType.isLocal)
  }

  private static async initApi(apiUri: string, metadataCache?: Record<string, any>) {
    const wsProvider: WsProvider = new WsProvider(apiUri)
    const api = await ApiPromise.create({ provider: wsProvider, types, metadata: metadataCache })

    // Initializing some api params based on pioneer/packages/react-api/Api.tsx
    const [properties, chainType] = await Promise.all([api.rpc.system.properties(), api.rpc.system.chainType()])

    const tokenSymbol = properties.tokenSymbol.unwrap()[0].toString()
    const tokenDecimals = properties.tokenDecimals.unwrap()[0].toNumber()

    // formatBlanace config
    formatBalance.setDefaults({
      decimals: tokenDecimals,
      unit: tokenSymbol,
    })

    return { api, properties, chainType }
  }

  public get query(): ApiPromise['query'] {
    return this._api.query
  }

  public get tx(): ApiPromise['tx'] {
    return this._api.tx
  }

  public get consts(): ApiPromise['consts'] {
    return this._api.consts
  }

  public get derive(): ApiPromise['derive'] {
    return this._api.derive
  }

  public get createType(): ApiPromise['createType'] {
    return this._api.createType.bind(this._api)
  }

  public sudo(tx: SubmittableExtrinsic<'promise'>): SubmittableExtrinsic<'promise'> {
    return this._api.tx.sudo.sudo(tx)
  }

  public async estimateFee(account: KeyringPair, tx: SubmittableExtrinsic<'promise'>): Promise<Balance> {
    const paymentInfo = await tx.paymentInfo(account)
    return paymentInfo.partialFee
  }

  public findEvent<
    S extends keyof ApiPromise['events'] & string,
    M extends keyof ApiPromise['events'][S] & string,
    EventType = ApiPromise['events'][S][M] extends AugmentedEvent<'promise', infer T> ? IEvent<T> : never
  >(result: SubmittableResult, section: S, method: M): EventType | undefined {
    return result.findRecord(section, method)?.event as EventType | undefined
  }

  public getEvent<
    S extends keyof ApiPromise['events'] & string,
    M extends keyof ApiPromise['events'][S] & string,
    EventType = ApiPromise['events'][S][M] extends AugmentedEvent<'promise', infer T> ? IEvent<T> : never
  >(result: SubmittableResult, section: S, method: M): EventType {
    const event = this.findEvent(result, section, method)
    if (!event) {
      throw new Error(`Cannot find expected ${section}.${method} event in result: ${result.toHuman()}`)
    }
    return (event as unknown) as EventType
  }

  sendExtrinsic(keyPair: KeyringPair, tx: SubmittableExtrinsic<'promise'>): Promise<SubmittableResult> {
    this.logger.info(`Sending ${tx.method.section}.${tx.method.method} extrinsic from ${keyPair.address}`)
    return new Promise((resolve, reject) => {
      let unsubscribe: () => void
      tx.signAndSend(keyPair, {}, (result) => {
        // Implementation loosely based on /pioneer/packages/react-signer/src/Modal.tsx
        if (!result || !result.status) {
          return
        }

        if (result.status.isInBlock) {
          unsubscribe()
          result.events
            .filter(({ event }) => event.section === 'system')
            .forEach(({ event }) => {
              if (event.method === 'ExtrinsicFailed') {
                const dispatchError = event.data[0] as DispatchError
                let errorMsg = dispatchError.toString()
                if (dispatchError.isModule) {
                  try {
                    const { name, docs } = this._api.registry.findMetaError(dispatchError.asModule)
                    errorMsg = `${name} (${docs.join(', ')})`
                  } catch (e) {
                    // This probably means we don't have this error in the metadata
                    // In this case - continue (we'll just display dispatchError.toString())
                  }
                }
                reject(new ExtrinsicFailedError(`Extrinsic execution error: ${errorMsg}`))
              } else if (event.method === 'ExtrinsicSuccess') {
                resolve(result)
              }
            })
        } else if (result.isError) {
          reject(new ExtrinsicFailedError('Extrinsic execution error!'))
        }
      })
        .then((unsubFunc) => (unsubscribe = unsubFunc))
        .catch((e) =>
          reject(new ExtrinsicFailedError(`Cannot send the extrinsic: ${e.message ? e.message : JSON.stringify(e)}`))
        )
    })
  }
}
