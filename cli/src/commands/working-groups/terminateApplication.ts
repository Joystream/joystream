import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase';
import _ from 'lodash';
import ExitCodes from '../../ExitCodes';
import { apiModuleByGroup } from '../../Api';
import { WorkerApplicationId } from '@joystream/types/lib/working-group';
import { ApplicationStageKeys } from '@joystream/types/lib/hiring';
import chalk from 'chalk';

export default class WorkingGroupsTerminateApplication extends WorkingGroupsCommandBase {
    static description = 'Terminates given worker application. Requires lead access.';
    static args = [
        {
            name: 'workerApplicationId',
            required: true,
            description: 'Worker Application ID'
        },
    ]
    static flags = {
        ...WorkingGroupsCommandBase.flags,
    };

    async run() {
        const { args } = this.parse(WorkingGroupsTerminateApplication);

        const account = await this.getRequiredSelectedAccount();
        // Lead-only gate
        await this.getRequiredLead();

        const application = await this.getApi().groupApplication(this.group, parseInt(args.workerApplicationId));

        if (application.stage !== ApplicationStageKeys.Active) {
            this.error('This application is not active!', { exit: ExitCodes.InvalidInput });
        }

        await this.requestAccountDecoding(account);

        await this.sendAndFollowExtrinsic(
            account,
            apiModuleByGroup[this.group],
            'terminateWorkerApplication',
            [new WorkerApplicationId(application.workerApplicationId)]
        );

        this.log(chalk.green(`Application ${chalk.white(application.workerApplicationId)} has been succesfully terminated!`));
    }
}
