import { extendDebug } from 'src/Debugger'
import { FixtureRunner } from 'src/Fixture'
import { FlowProps } from 'src/Flow'
import { Option } from '@polkadot/types'
import { assert } from 'chai'
import BN from 'bn.js'
import { PalletStakingValidatorPrefs } from '@polkadot/types/lookup'

export default async function validateSucceedsInPoA({ api, query, env }: FlowProps): Promise<void> {
    const debug = extendDebug('flow: validator-set')
    debug('started')
    api.enableDebugTxLogs()

    // we are in poa
    const currentEra = api.getCurrentEra()
    assert(currentEra.isNone)

    // create keys and bonding tx
    const [nominatorAccount, validatorAccount] = (await api.createKeyPairs(2)).map(({ key, }) => key.address)

    // bond nominator account
    const input = {
        stash: nominatorAccount,
        controller: nominatorAccount,
        bondAmount: new BN(100000)
    }
    const bondTx = api.tx.staking.bond(input.controller, input.bondAmount, 'Stash')
    const bondingFees = await api.estimateTxFee(bondTx, input.stash)
    await api.treasuryTransferBalance(input.stash, input.bondAmount.add(bondingFees))
    const bondingTxResult = await api.signAndSend(bondTx, input.stash)
    assert(bondingTxResult.isCompleted)

    // bond and candidate validator
    const inputValidator = {
        stash: nominatorAccount,
        controller: nominatorAccount,
        bondAmount: new BN(100000)
    }
    const validatorBondTx = api.tx.staking.bond(inputValidator.controller, inputValidator.bondAmount, 'Stash')
    const validatorBondingFees = await api.estimateTxFee(validatorBondTx, inputValidator.stash)
    await api.treasuryTransferBalance(inputValidator.stash, inputValidator.bondAmount.add(validatorBondingFees))
    const validatorBondingTxResult = await api.signAndSend(validatorBondTx, inputValidator.stash)
    assert(validatorBondingTxResult.isCompleted)

    // attempt to nominate
    const nominateTx = api.tx.staking.nominate([validatorAccount])
    const nominatingFees = await api.estimateTxFee(nominateTx, input.controller)
    await api.treasuryTransferBalance(input.stash, nominatingFees)
    const nominateTxResult = await api.signAndSend(nominateTx, input.controller)
    assert(nominateTxResult.isCompleted)

}
