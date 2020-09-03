import AccountsCommandBase from '../../base/AccountsCommandBase'
import { AccountSummary, NameValueObj, NamedKeyringPair } from '../../Types'
import { DerivedBalances } from '@polkadot/api-derive/types'
import { displayHeader, displayNameValueTable } from '../../helpers/display'
import { formatBalance } from '@polkadot/util'
import moment from 'moment'

export default class AccountCurrent extends AccountsCommandBase {
  static description = 'Display information about currently choosen default account'
  static aliases = ['account:info', 'account:default']

  async run() {
    const currentAccount: NamedKeyringPair = await this.getRequiredSelectedAccount(false)
    const summary: AccountSummary = await this.getApi().getAccountSummary(currentAccount.address)

    displayHeader('Account information')
    const creationDate: string = currentAccount.meta.whenCreated
      ? moment(currentAccount.meta.whenCreated).format('YYYY-MM-DD HH:mm:ss')
      : '?'
    const accountRows: NameValueObj[] = [
      { name: 'Account name:', value: currentAccount.meta.name },
      { name: 'Address:', value: currentAccount.address },
      { name: 'Created:', value: creationDate },
    ]
    displayNameValueTable(accountRows)

    displayHeader('Balances')
    const balances: DerivedBalances = summary.balances
    const balancesRows: NameValueObj[] = [
      { name: 'Total balance:', value: formatBalance(balances.votingBalance) },
      { name: 'Transferable balance:', value: formatBalance(balances.availableBalance) },
    ]
    if (balances.lockedBalance.gtn(0)) {
      balancesRows.push({ name: 'Locked balance:', value: formatBalance(balances.lockedBalance) })
    }
    if (balances.reservedBalance.gtn(0)) {
      balancesRows.push({ name: 'Reserved balance:', value: formatBalance(balances.reservedBalance) })
    }
    displayNameValueTable(balancesRows)
  }
}
