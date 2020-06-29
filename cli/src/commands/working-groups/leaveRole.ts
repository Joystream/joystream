import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase';
import _ from 'lodash';
import { apiModuleByGroup } from '../../Api';
import { minMaxStr } from '../../validators/common';
import chalk from 'chalk';

export default class WorkingGroupsLeaveRole extends WorkingGroupsCommandBase {
    static description = 'Leave the role associated with currently selected account.';
    static flags = {
        ...WorkingGroupsCommandBase.flags,
    };

    async run() {
        const account = await this.getRequiredSelectedAccount();
        // Worker-only gate
        const worker = await this.getRequiredWorker();

        const constraint = await this.getApi().workerExitRationaleConstraint(this.group);
        const rationaleValidator = minMaxStr(constraint.min.toNumber(), constraint.max.toNumber());
        const rationale = await this.promptForParam('Bytes', 'rationale', undefined, rationaleValidator);

        await this.requestAccountDecoding(account);

        await this.sendAndFollowExtrinsic(
            account,
            apiModuleByGroup[this.group],
            'leaveRole',
            [
                worker.workerId,
                rationale
            ]
        );

        this.log(chalk.green(`Succesfully left the role! (worker id: ${chalk.white(worker.workerId.toNumber())})`));
    }
}
