import BN from 'bn.js';
import AccountsCommandBase from '../../base/AccountsCommandBase';
import chalk from 'chalk';
import ExitCodes from '../../ExitCodes';
import { formatBalance } from '@polkadot/util';
import { Hash } from '@polkadot/types/interfaces';
import Api from '../../Api';
import { AccountBalances, NamedKeyringPair } from '../../Types';
import { checkBalance, validateAddress } from '../../helpers/validation';

type AccountTransferArgs = {
    recipient: string,
    amount: string
};

export default class AccountTransferTokens extends AccountsCommandBase {
    static description = 'Transfer tokens from currently choosen account';

    static args = [
        {
            name: 'recipient',
            required: true,
            description: 'Address of the transfer recipient'
        },
        {
            name: 'amount',
            required: true,
            description: 'Amount of tokens to transfer'
        },
    ];

    async run() {
        const args: AccountTransferArgs = <AccountTransferArgs> this.parse(AccountTransferTokens).args;
        const api: Api = new Api();
        const selectedAccount: NamedKeyringPair = await this.getRequiredSelectedAccount();
        const amountBN: BN = new BN(args.amount);

        // Initial validation
        validateAddress(args.recipient, 'Invalid recipient address');
        const accBalances: AccountBalances = (await api.getAccountsBalancesInfo([ selectedAccount.address ]))[0];
        checkBalance(accBalances, amountBN);

        await this.requestAccountDecoding(selectedAccount);

        this.log(chalk.white('Estimating fee...'));
        let estimatedFee: BN;
        try {
            estimatedFee = await api.estimateFee(selectedAccount, args.recipient, amountBN);
        }
        catch (e) {
            this.error('Could not estimate the fee.', { exit: ExitCodes.UnexpectedException });
        }
        const totalAmount: BN = amountBN.add(estimatedFee);
        this.log(chalk.white('Estimated fee:', formatBalance(estimatedFee)));
        this.log(chalk.white('Total transfer amount:', formatBalance(totalAmount)));

        checkBalance(accBalances, totalAmount);

        await this.requireConfirmation('Do you confirm the transfer?');

        try {
            const txHash: Hash = await api.transfer(selectedAccount, args.recipient, amountBN);
            this.log(chalk.greenBright('Transaction succesfully sent!'));
            this.log(chalk.white('Hash:', txHash.toString()));
        } catch (e) {
            this.error('Could not send the transaction.', { exit: ExitCodes.UnexpectedException });
        }
    }
  }
