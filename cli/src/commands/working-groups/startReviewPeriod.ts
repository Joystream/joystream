import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase';
import _ from 'lodash';
import { OpeningStatus } from '../../Types';
import { apiModuleByGroup } from '../../Api';
import { OpeningId } from '@joystream/types/hiring';
import chalk from 'chalk';

export default class WorkingGroupsStartReviewPeriod extends WorkingGroupsCommandBase {
    static description = 'Changes the status of active opening to "In review". Requires lead access.';
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
        const { args } = this.parse(WorkingGroupsStartReviewPeriod);

        const account = await this.getRequiredSelectedAccount();
        // Lead-only gate
        await this.getRequiredLead();

        const openingId = parseInt(args.wgOpeningId);
        // We don't need the actual opening here, so this is just for validation purposes
        await this.getOpeningForLeadAction(openingId, OpeningStatus.AcceptingApplications);

        await this.requestAccountDecoding(account);

        await this.sendAndFollowExtrinsic(
            account,
            apiModuleByGroup[this.group],
            'beginApplicantReview',
            [ new OpeningId(openingId) ]
        );

        this.log(chalk.green(`Opening ${chalk.white(openingId)} status changed to: ${ chalk.white('In Review') }`));
    }
}
