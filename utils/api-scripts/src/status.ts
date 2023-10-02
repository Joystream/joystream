import '@joystream/types'
import { ApiPromise, WsProvider } from '@polkadot/api'
import BN from 'bn.js'

async function main() {
  const endpoint = process.env.WS_URI || 'ws://127.0.0.1:9944'
  const provider = new WsProvider(endpoint)

  // Create the API and wait until ready
  let api: ApiPromise
  let retry = 15
  while (true) {
    try {
      api = new ApiPromise({ provider })
      await api.isReadyOrError
      break
    } catch (err) {
      // Exceptions are not being caught!?
      // failed to connect to node
      console.error('Caught Error', err)
    }

    if (retry-- === 0) {
      process.exit(-1)
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 5000)
    })
  }

  // Retrieve the chain & node information information via rpc calls
  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version(),
  ])

  console.log(`Chain ${chain} using ${nodeName} v${nodeVersion}`)

  // const council = ((await api.query.council.activeCouncil()) as unknown) as Seat[]
  const validators = await api.query.session.validators()
  const version = await api.rpc.state.getRuntimeVersion()

  console.log(`Runtime Version: ${version.authoringVersion}.${version.specVersion}.${version.implVersion}`)

  // number of council members
  // console.log('Council size:', council.length)

  console.log('Validator count:', validators.length)

  if (validators && validators.length > 0) {
    // Retrieve the balances of validators' stash accounts
    // for more detailed staking information we can use api.derive.staking.*
    const validatorBalances = await Promise.all(validators.map((authorityId) => api.derive.balances.all(authorityId)))

    const totalValidatorBalances = validatorBalances.reduce((total, value) => total.add(value.lockedBalance), new BN(0))

    console.log('Total Validator Locked Balances:', totalValidatorBalances.toString())
  }

  await api.disconnect()
}

main().catch(console.error)
