/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/restrict-template-expressions */

import { KeyringPair } from '@polkadot/keyring/types'
import { GenericSignerPayload } from '@polkadot/types'
import { createMetadata, OptionsWithMeta, UnsignedTransaction } from '@substrate/txwrapper-core'

/**
 * Signing function. Implement this on the OFFLINE signing device.
 *
 * @param pair - The signing pair.
 * @param signingPayload - Payload to sign.
 */
export function signWith(
  pair: KeyringPair,
  signingPayload: UnsignedTransaction,
  options: OptionsWithMeta
): `0x${string}` {
  const { registry, metadataRpc } = options
  // Important! The registry needs to be updated with latest metadata, so make
  // sure to run `registry.setMetadata(metadata)` before signing.
  registry.setMetadata(createMetadata(registry, metadataRpc))

  const payload = new GenericSignerPayload(registry, {
    ...signingPayload,
    runtimeVersion: {
      specVersion: signingPayload.specVersion,
      transactionVersion: signingPayload.transactionVersion,
    },
  }).toPayload()

  const { signature } = registry
    .createType('ExtrinsicPayload', payload, {
      version: payload.version,
    })
    .sign(pair)

  return signature
}
