import BN from 'bn.js'
import AccountsCommandBase from '../../base/AccountsCommandBase'
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

    await this.sendAndFollowNamedTx(selectedAccount, 'balances', 'transferKeepAlive', [args.recipient, amountBN])
  }
}
