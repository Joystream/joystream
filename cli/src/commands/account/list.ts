import AccountsCommandBase from '../../base/AccountsCommandBase'
import { displayTable } from '../../helpers/display'
import { formatBalance } from '@polkadot/util'

export default class AccountList extends AccountsCommandBase {
  static description = 'List all available accounts'

  async run(): Promise<void> {
    const pairs = this.getPairs()
    const balances = await this.getApi().getAccountsBalancesInfo(pairs.map((p) => p.address))

    if (pairs.length) {
      displayTable(
        pairs.map((p, i) => ({
          'Name': p.meta.name,
          'Address': p.address,
          'Available balance': formatBalance(balances[i].availableBalance),
          'Total balance': formatBalance(balances[i].votingBalance),
        })),
        3
      )
    } else {
      this.log('No accounts available!')
    }
  }
}
