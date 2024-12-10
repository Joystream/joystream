import { AnyJson } from '@polkadot/types/types'
import { GenericExtrinsic } from '@polkadot/types/extrinsic/Extrinsic'
import { Vec } from '@polkadot/types'
import { EventRecord, Event } from '@polkadot/types/interfaces'
import { decodeError } from './decodeError'
import { ApiPromise } from '@polkadot/api'

export interface TransactionDetails {
  section?: string
  method?: string
  args?: AnyJson[]
  signer?: string
  nonce?: number
  events?: Event[]
  eventsDecoded?: AnyJson[]
  result?: string
  blockNumber?: number
  blockHash?: string
  txHash?: string
  error?: string
}

export async function constructTransactionDetails(
  api: ApiPromise,
  blockHash: string,
  index: number,
  extrinsic: GenericExtrinsic
): Promise<TransactionDetails> {
  const details: TransactionDetails = {}
  const {
    method: { args, section, method },
    signer,
    nonce,
  } = extrinsic

  details.section = section
  details.method = method
  details.args = args.map((arg) => arg.toHuman())
  if (signer) {
    details.signer = signer.toString()
  }
  details.nonce = nonce.toNumber()
  details.txHash = extrinsic.hash.toHex()

  // Fetch the block and its associated events
  const atApi = await api.at(blockHash)
  const blockEvents = (await atApi.query.system.events()) as unknown as Vec<EventRecord>

  // Check for related events
  const relatedEvents = blockEvents.filter(
    ({ phase }: EventRecord) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index)
  )

  details.events = relatedEvents.map(({ event }: EventRecord) => event)
  details.eventsDecoded = relatedEvents.map(({ event }: EventRecord) => event.toHuman())

  for (const { event } of relatedEvents) {
    if (event.section === 'system' && event.method === 'ExtrinsicSuccess') {
      details.result = 'Success'
    } else if (event.section === 'system' && event.method === 'ExtrinsicFailed') {
      details.result = 'Failed'
      details.error = decodeError(api, event)
    }
  }

  return details
}
