import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase';
import _ from 'lodash';
import { apiModuleByGroup } from '../../Api';
import { WorkerId } from '@joystream/types/lib/working-group';
import { bool } from '@polkadot/types/primitive';
import { formatBalance } from '@polkadot/util';
import chalk from 'chalk';

export default class WorkingGroupsEvictWorker extends WorkingGroupsCommandBase {
    static description = 'Evicts given worker. Requires lead access.';
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
        const { args } = this.parse(WorkingGroupsEvictWorker);

        const account = await this.getRequiredSelectedAccount();
        // Lead-only gate
        await this.getRequiredLead();

        const workerId = parseInt(args.workerId);
        // This will also make sure the worker is valid
        const groupMember = await this.getApi().groupMember(this.group, workerId);

        const rationale = await this.promptForParam('Bytes', 'rationale');  // TODO: Terminate worker text limits? (minMaxStr)
        const shouldSlash = await this.simplePrompt({
            message: `Should the worker stake (${formatBalance(groupMember.stake)}) be slashed?`,
            type: 'confirm',
            default: false
        });

        await this.requestAccountDecoding(account);

        await this.sendAndFollowExtrinsic(
            account,
            apiModuleByGroup[this.group],
            'terminateRole',
            [
                new WorkerId(workerId),
                rationale,
                new bool(shouldSlash)
            ]
        );

        this.log(chalk.green(`Worker ${chalk.white(workerId)} has been evicted!`));
        if (shouldSlash) {
            this.log(chalk.green(`Worker stake totalling ${chalk.white(formatBalance(groupMember.stake))} has been slashed!`));
        }
    }
}
