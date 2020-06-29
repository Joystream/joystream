import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase';
import _ from 'lodash';
import { apiModuleByGroup } from '../../Api';
import { WorkerId } from '@joystream/types/lib/working-group';
import { formatBalance } from '@polkadot/util';
import chalk from 'chalk';
import { Reward } from '../../Types';
import { positiveInt } from '../../validators/common';

export default class WorkingGroupsUpdateWorkerReward extends WorkingGroupsCommandBase {
    static description = 'Change given worker\'s reward (amount only). Requires lead access.';
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

    formatReward(reward?: Reward) {
        return (
            reward
                ?
                    formatBalance(reward.value) + (reward.interval && ` / ${reward.interval} block(s)`) +
                    (reward.nextPaymentBlock && ` (next payment: #${ reward.nextPaymentBlock })`)
                : 'NONE'
        );
    }

    async run() {
        const { args } = this.parse(WorkingGroupsUpdateWorkerReward);

        const account = await this.getRequiredSelectedAccount();
        // Lead-only gate
        await this.getRequiredLead();

        const workerId = parseInt(args.workerId);
        // This will also make sure the worker is valid
        const groupMember = await this.getApi().groupMember(this.group, workerId);

        const { reward } = groupMember;
        console.log(chalk.white(`Current worker reward: ${this.formatReward(reward)}`));

        const newRewardValue = await this.promptForParam('BalanceOfMint', 'new_amount', undefined, positiveInt());

        await this.requestAccountDecoding(account);

        await this.sendAndFollowExtrinsic(
            account,
            apiModuleByGroup[this.group],
            'updateRewardAmount',
            [
                new WorkerId(workerId),
                newRewardValue
            ]
        );

        const updatedGroupMember = await this.getApi().groupMember(this.group, workerId);
        this.log(chalk.green(`Worker ${chalk.white(workerId)} reward has been updated!`));
        this.log(chalk.green(`New worker reward: ${chalk.white(this.formatReward(updatedGroupMember.reward))}`));
    }
}
