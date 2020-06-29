import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase';
import _ from 'lodash';
import { apiModuleByGroup } from '../../Api';
import { WorkerId } from '@joystream/types/lib/working-group';
import { Balance } from '@polkadot/types/interfaces';
import { formatBalance } from '@polkadot/util';
import { minMaxInt } from '../../validators/common';
import chalk from 'chalk';

export default class WorkingGroupsSlashWorker extends WorkingGroupsCommandBase {
    static description = 'Slashes given worker stake. Requires lead access.';
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
        const { args } = this.parse(WorkingGroupsSlashWorker);

        const account = await this.getRequiredSelectedAccount();
        // Lead-only gate
        await this.getRequiredLead();

        const workerId = parseInt(args.workerId);
        // This will also make sure the worker is valid
        const groupMember = await this.getApi().groupMember(this.group, workerId);

        this.log(chalk.white('Current worker stake: ', formatBalance(groupMember.stake)));
        const balanceValidator = minMaxInt(1, groupMember.stake.toNumber());
        const balance = await this.promptForParam('Balance', undefined, undefined, balanceValidator) as Balance;

        await this.requestAccountDecoding(account);

        await this.sendAndFollowExtrinsic(
            account,
            apiModuleByGroup[this.group],
            'slashStake',
            [
                new WorkerId(workerId),
                balance
            ]
        );

        this.log(chalk.green(`${chalk.white(formatBalance(balance))} from worker ${chalk.white(workerId)} balance has been succesfully slashed!`));
    }
}
