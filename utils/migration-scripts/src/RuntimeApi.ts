import { types } from '@joystream/types'
import { ApiPromise, SubmittableResult } from '@polkadot/api'
import { SubmittableExtrinsic, AugmentedEvent, ApiOptions, AugmentedQuery } from '@polkadot/api/types'
import { KeyringPair } from '@polkadot/keyring/types'
import { Call } from '@polkadot/types/interfaces'
import { Codec, IEvent } from '@polkadot/types/types'
import { DispatchError } from '@polkadot/types/interfaces/system'
import { UInt } from '@polkadot/types'
import { Observable } from 'rxjs'
import BN from 'bn.js'

export class ExtrinsicFailedError extends Error {}

// Joystream runtime api utility class. Based on distributor node CLI / Joystream CLI implementation

type EventSection = keyof ApiPromise['events'] & string
type EventMethod<Section extends EventSection> = keyof ApiPromise['events'][Section] & string
type EventType<
  Section extends EventSection,
  Method extends EventMethod<Section>
> = ApiPromise['events'][Section][Method] extends AugmentedEvent<'promise', infer T> ? IEvent<T> : never

export class RuntimeApi extends ApiPromise {
  constructor(options: Omit<ApiOptions, 'types'>) {
    super({ ...options, types })
  }

  public findEvent<S extends EventSection, M extends EventMethod<S>>(
    result: SubmittableResult,
    section: S,
    method: M
  ): EventType<S, M> | undefined {
    return result.findRecord(section, method)?.event as EventType<S, M> | undefined
  }

  public getEvent<S extends EventSection, M extends EventMethod<S>>(
    result: SubmittableResult,
    section: S,
    method: M
  ): EventType<S, M> {
    const event = this.findEvent(result, section, method)
    if (!event) {
      throw new Error(`Cannot find expected ${section}.${method} event in result: ${JSON.stringify(result.toHuman())}`)
    }
    return event
  }

  public findEvents<S extends EventSection, M extends EventMethod<S>>(
    result: SubmittableResult,
    section: S,
    method: M,
    expectedCount?: number
  ): EventType<S, M>[] {
    const events = result.filterRecords(section, method).map((r) => r.event)
    if (expectedCount && events.length !== expectedCount) {
      throw new Error(
        `Unexpected count of ${section}.${method} events in result: ${JSON.stringify(result.toHuman())}. ` +
          `Expected: ${expectedCount}, Got: ${events.length}`
      )
    }
    return (events.sort((a, b) => new BN(a.index).cmp(new BN(b.index))) as unknown) as EventType<S, M>[]
  }

  private formatDispatchError(err: DispatchError): string {
    try {
      const { name, docs } = this.registry.findMetaError(err.asModule)
      return `${name} (${docs.join(', ')})`
    } catch (e) {
      return err.toString()
    }
  }

  async entriesByIds<IDType extends UInt, ValueType extends Codec>(
    apiMethod: AugmentedQuery<'promise', (key: IDType) => Observable<ValueType>, [IDType]>
  ): Promise<[IDType, ValueType][]> {
    const entries: [IDType, ValueType][] = (await apiMethod.entries()).map(([storageKey, value]) => [
      storageKey.args[0] as IDType,
      value,
    ])

    return entries.sort((a, b) => a[0].toNumber() - b[0].toNumber())
  }

  sendExtrinsic(keyPair: KeyringPair, tx: SubmittableExtrinsic<'promise'>): Promise<SubmittableResult> {
    let txName = `${tx.method.section}.${tx.method.method}`
    if (txName === 'sudo.sudo') {
      const innerCall = tx.args[0] as Call
      txName = `sudo.sudo(${innerCall.section}.${innerCall.method})`
    }
    console.log(`Sending ${txName} extrinsic from ${keyPair.address}`)
    return new Promise((resolve, reject) => {
      let unsubscribe: () => void
      tx.signAndSend(keyPair, {}, (result) => {
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
                reject(
                  new ExtrinsicFailedError(`Extrinsic execution error: ${this.formatDispatchError(dispatchError)}`)
                )
              } else if (event.method === 'ExtrinsicSuccess') {
                if (txName === 'sudo.sudo') {
                  const sudidEvent = this.getEvent(result, 'sudo', 'Sudid')
                  const [dispatchResult] = sudidEvent.data
                  if (dispatchResult.isErr) {
                    return reject(
                      new ExtrinsicFailedError(
                        `Sudo extrinsic execution error! ${this.formatDispatchError(dispatchResult.asErr)}`
                      )
                    )
                  }
                }

                if (txName === 'sudo.sudoAs') {
                  const sudoAsDoneEvent = this.getEvent(result, 'sudo', 'SudoAsDone')
                  const [sudoAsDone] = sudoAsDoneEvent.data
                  if (sudoAsDone.isFalse) {
                    return reject(new ExtrinsicFailedError(`SudoAs failed!`))
                  }
                }

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
