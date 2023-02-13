import { ApiPromise, WsProvider } from '@polkadot/api'
import fs from 'fs'

// Fetch the proposed runtime from an active proposal
// If proposal has already been decided, executed or rejected the proposal details will not be
// available on chain, as they are cleaned up after the proposal is finalized.
async function main() {
  const proposalId = parseInt(process.argv[2])
  const outputFilePath = process.argv[3] || 'runtime.wasm'

  const endpoint = process.env.WS_URI || 'ws://127.0.0.1:9944'
  const provider = new WsProvider(endpoint)

  const api: ApiPromise = new ApiPromise({ provider })
  await api.isReadyOrError

  const proposalCallCode = await api.query.proposalsEngine.dispatchableCallCode(proposalId)

  await api.disconnect()

  // attempt to decode as Call
  const extrinsicCall = api.createType('Call', proposalCallCode.toHex())

  const { method, section } = api.registry.findMetaCall(extrinsicCall.callIndex)

  if (method !== 'executeRuntimeUpgradeProposal' || section !== 'joystreamUtility') {
    throw new Error('This is not the proposal you are looking for!')
  }

  // The first arg to joystreamUtility.executeRuntimeUpgradeProposal(wasm) is the proposed wasm code
  const wasm = extrinsicCall.args[0]

  fs.writeFileSync(outputFilePath, wasm.toU8a(true))
}

main()
  .catch(console.error)
  .finally(() => process.exit())
