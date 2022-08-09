import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import _ from 'lodash'
import BN from 'bn.js'

export default async function initFaucet({ api, env, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:initFaucet')
  debug('Started')

  // Send the faucet account some funds
  const creditPerMember = parseInt(process.env.BALANCE_CREDIT || '50000000')

  // Funds for 1000 members
  const funds = new BN(creditPerMember).muln(1000)
  const faucetSuri = env.INVITER_KEY || '//Faucet'
  const faucetAccount = api.createCustomKeyPair(faucetSuri, true).address

  await api.treasuryTransferBalanceToAccounts([faucetAccount], funds)

  api.setFaucetInfo({ suri: faucetSuri })

  debug('Done')
}
