import { AnyJson } from '@polkadot/types/types'
import { GenericExtrinsic } from '@polkadot/types/extrinsic/Extrinsic'
import { Vec } from '@polkadot/types'
import { EventRecord } from '@polkadot/types/interfaces'

export interface TransactionDetails {
  section?: string
  method?: string
  args?: AnyJson[]
  signer?: string
  nonce?: number
  events?: AnyJson[]
  result?: string
  blockNumber?: number
  blockHash?: string
  txHash?: string
}

export function constructTransactionDetails(
  blockEvents: Vec<EventRecord>,
  index: number,
  extrinsic: GenericExtrinsic
): TransactionDetails {
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

  // Check for related events
  const relatedEvents = blockEvents.filter(
    ({ phase }: EventRecord) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index)
  )

  details.events = relatedEvents.map(({ event }: EventRecord) => event.toHuman())

  for (const { event } of relatedEvents) {
    if (event.section === 'system' && event.method === 'ExtrinsicSuccess') {
      details.result = 'Success'
    } else if (event.section === 'system' && event.method === 'ExtrinsicFailed') {
      details.result = 'Failed'
    }
  }

  return details
}
