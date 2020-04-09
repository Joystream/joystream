import AccountsCommandBase from '../../base/AccountsCommandBase';
import chalk from 'chalk';
import ExitCodes from '../../ExitCodes';
import { NamedKeyringPair } from '../../Types'

export default class AccountChoose extends AccountsCommandBase {
    static description = 'Choose default account to use in the CLI';

    async run() {
        const accounts: NamedKeyringPair[] = this.fetchAccounts();
        const selectedAccount: NamedKeyringPair | null = this.getSelectedAccount();

        this.log(chalk.white(`Found ${ accounts.length } existing accounts...\n`));

        if (accounts.length === 0) {
            this.warn('No account to choose from. Add accont using account:import or account:create.');
            this.exit(ExitCodes.NoAccountFound);
        }

        const choosenAccount: NamedKeyringPair = await this.promptForAccount(accounts, selectedAccount);

        this.setSelectedAccount(choosenAccount);
        this.log(chalk.greenBright("\nAccount switched!"));
    }
  }
