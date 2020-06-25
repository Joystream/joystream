import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase';
import _ from 'lodash';
import ExitCodes from '../../ExitCodes';
import { apiModuleByGroup } from '../../Api';
import { ApplicationStageKeys, ApplicationId } from '@joystream/types/lib/hiring';
import chalk from 'chalk';

export default class WorkingGroupsTerminateApplication extends WorkingGroupsCommandBase {
    static description = 'Terminates given working group application. Requires lead access.';
    static args = [
        {
            name: 'wgApplicationId',
            required: true,
            description: 'Working Group Application ID'
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

        const application = await this.getApi().groupApplication(this.group, parseInt(args.wgApplicationId));

        if (application.stage !== ApplicationStageKeys.Active) {
            this.error('This application is not active!', { exit: ExitCodes.InvalidInput });
        }

        await this.requestAccountDecoding(account);

        await this.sendAndFollowExtrinsic(
            account,
            apiModuleByGroup[this.group],
            'terminateApplication',
            [new ApplicationId(application.wgApplicationId)]
        );

        this.log(chalk.green(`Application ${chalk.white(application.wgApplicationId)} has been succesfully terminated!`));
    }
}
