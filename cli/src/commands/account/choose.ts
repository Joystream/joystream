import AccountsCommandBase from '../../base/AccountsCommandBase';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ExitCodes from '../../ExitCodes';
import { KeyringPair$Json } from '@polkadot/keyring/types';


export default class AccountChoose extends AccountsCommandBase {
    static description = 'Choose current account to use in the CLI';

    async run() {
        const accounts: KeyringPair$Json[] = this.fetchAccounts();
        const selectedAccountFilename: string = this.getSelectedAccountFilename();

        this.log(`Found ${ accounts.length } existing accounts\n\n`);

        if (accounts.length === 0) {
            this.log('Exiting');
            this.exit(ExitCodes.OK);
        }

        const { chosenAccount } = await inquirer.prompt([{
            name: 'chosenAccount',
            message: 'Select an account',
            type: 'list',
            choices: accounts.map(accountObj => ({
                name: `${ accountObj.meta.name }: ${ accountObj.address }`,
                value: this.generateAccountFilename(accountObj)
            })),
            default: selectedAccountFilename
        }]);

        this.setSelectedAccount(chosenAccount);
        this.log(chalk.bold.greenBright("\n\nAccount switched!"));
    }
  }
