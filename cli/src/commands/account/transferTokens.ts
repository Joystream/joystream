import BN from 'bn.js'
import AccountsCommandBase from '../../base/AccountsCommandBase'
import chalk from 'chalk'
import ExitCodes from '../../ExitCodes'
import { formatBalance } from '@polkadot/util'
import { Hash } from '@polkadot/types/interfaces'
import { NamedKeyringPair } from '../../Types'
import { checkBalance, validateAddress } from '../../helpers/validation'

type AccountTransferArgs = {
  recipient: string
  amount: string
}

export default class AccountTransferTokens extends AccountsCommandBase {
  static description = 'Transfer tokens from currently choosen account'

  static args = [
    {
      name: 'recipient',
      required: true,
      description: 'Address of the transfer recipient',
    },
    {
      name: 'amount',
      required: true,
      description: 'Amount of tokens to transfer',
    },
  ]

  async run() {
    const args: AccountTransferArgs = this.parse(AccountTransferTokens).args as AccountTransferArgs
    const selectedAccount: NamedKeyringPair = await this.getRequiredSelectedAccount()
    const amountBN: BN = new BN(args.amount)

    // Initial validation
    validateAddress(args.recipient, 'Invalid recipient address')
    const accBalances = (await this.getApi().getAccountsBalancesInfo([selectedAccount.address]))[0]
    checkBalance(accBalances, amountBN)

    await this.requestAccountDecoding(selectedAccount)

    this.log(chalk.magentaBright('Estimating fee...'))
    const tx = await this.getApi().createTransferTx(args.recipient, amountBN)
    let estimatedFee: BN
    try {
      estimatedFee = await this.getApi().estimateFee(selectedAccount, tx)
    } catch (e) {
      this.error('Could not estimate the fee.', { exit: ExitCodes.UnexpectedException })
    }
    const totalAmount: BN = amountBN.add(estimatedFee)
    this.log(chalk.magentaBright('Estimated fee:', formatBalance(estimatedFee)))
    this.log(chalk.magentaBright('Total transfer amount:', formatBalance(totalAmount)))

    checkBalance(accBalances, totalAmount)

    await this.requireConfirmation('Do you confirm the transfer?')

    try {
      const txHash: Hash = await tx.signAndSend(selectedAccount)
      this.log(chalk.greenBright('Transaction successfully sent!'))
      this.log(chalk.magentaBright('Hash:', txHash.toString()))
    } catch (e) {
      this.error('Could not send the transaction.', { exit: ExitCodes.UnexpectedException })
    }
  }
}
