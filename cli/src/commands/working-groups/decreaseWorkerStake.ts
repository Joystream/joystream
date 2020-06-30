import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase';
import _ from 'lodash';
import { apiModuleByGroup } from '../../Api';
import { WorkerId } from '@joystream/types/lib/working-group';
import { Balance } from '@polkadot/types/interfaces';
import { formatBalance } from '@polkadot/util';
import { minMaxInt } from '../../validators/common';
import chalk from 'chalk';
import ExitCodes from '../../ExitCodes';

export default class WorkingGroupsDecreaseWorkerStake extends WorkingGroupsCommandBase {
    static description =
        'Decreases given worker stake by an amount that will be returned to the worker role account. ' +
        'Requires lead access.';
    static args = [
        {
            name: 'workerId',
            required: true,
            description: 'Worker ID'
        },
    ]
    static flags = {
        ...WorkingGroupsCommandBase.flags,
    };

    async run() {
        const { args } = this.parse(WorkingGroupsDecreaseWorkerStake);

        const account = await this.getRequiredSelectedAccount();
        // Lead-only gate
        await this.getRequiredLead();

        const workerId = parseInt(args.workerId);
        // This will also make sure the worker is valid
        const groupMember = await this.getApi().groupMember(this.group, workerId);

        if (!groupMember.stake) {
            this.error('This worker has no associated role stake profile!', { exit: ExitCodes.InvalidInput });
        }

        this.log(chalk.white('Current worker stake: ', formatBalance(groupMember.stake)));
        const balanceValidator = minMaxInt(1, groupMember.stake.toNumber());
        const balance = await this.promptForParam('Balance', 'amount', undefined, balanceValidator) as Balance;

        await this.requestAccountDecoding(account);

        await this.sendAndFollowExtrinsic(
            account,
            apiModuleByGroup[this.group],
            'decreaseStake',
            [
                new WorkerId(workerId),
                balance
            ]
        );

        this.log(chalk.green(
            `${chalk.white(formatBalance(balance))} from worker ${chalk.white(workerId)} stake `+
            `has been returned to worker's role account (${chalk.white(groupMember.roleAccount.toString())})!`
        ));
    }
}
