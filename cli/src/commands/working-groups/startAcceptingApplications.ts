import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase';
import _ from 'lodash';
import { OpeningStatus } from '../../Types';
import ExitCodes from '../../ExitCodes';
import { apiModuleByGroup } from '../../Api';
import { OpeningId } from '@joystream/types/lib/hiring';
import chalk from 'chalk';

export default class WorkingGroupsStartAcceptingApplications extends WorkingGroupsCommandBase {
    static description = 'Changes the status of pending opening to "Accepting applications". Requires lead access.';
    static args = [
        {
            name: 'wgOpeningId',
            required: true,
            description: 'Working Group Opening ID'
        },
    ]
    static flags = {
        ...WorkingGroupsCommandBase.flags,
    };

    async run() {
        const { args } = this.parse(WorkingGroupsStartAcceptingApplications);

        const account = await this.getRequiredSelectedAccount();
        // Lead-only gate
        await this.getRequiredLead();

        const opening = await this.getApi().groupOpening(this.group, parseInt(args.wgOpeningId));

        if (opening.stage.status !== OpeningStatus.WaitingToBegin) {
            this.error('This opening is not in "Waiting To Begin" stage!', { exit: ExitCodes.InvalidInput });
        }

        await this.requestAccountDecoding(account);

        await this.sendAndFollowExtrinsic(
            account,
            apiModuleByGroup[this.group],
            'acceptApplications',
            [ new OpeningId(opening.wgOpeningId) ]
        );

        this.log(chalk.green(`Opening ${chalk.white(opening.wgOpeningId)} status changed to: ${ chalk.white('Accepting Applications') }`));
    }
}
