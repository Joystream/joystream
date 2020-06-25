import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase';
import _ from 'lodash';
import { OpeningStatus } from '../../Types';
import ExitCodes from '../../ExitCodes';
import { apiModuleByGroup } from '../../Api';
import { OpeningId } from '@joystream/types/lib/hiring';
import { ApplicationIdSet } from '@joystream/types/lib/working-group';
import { RewardPolicy } from '@joystream/types/lib/content-working-group';
import chalk from 'chalk';

export default class WorkingGroupsFillOpening extends WorkingGroupsCommandBase {
    static description = 'Allows filling working group opening that\'s currently in review. Requires lead access.';
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
        const { args } = this.parse(WorkingGroupsFillOpening);

        const account = await this.getRequiredSelectedAccount();
        // Lead-only gate
        await this.getRequiredLead();

        const opening = await this.getApi().groupOpening(this.group, parseInt(args.wgOpeningId));

        if (opening.stage.status !== OpeningStatus.InReview) {
            this.error('This opening is not in the Review stage!', { exit: ExitCodes.InvalidInput });
        }

        const applicationIds = await this.promptForApplicationsToAccept(opening);
        const rewardPolicyOpt = await this.promptForParam(`Option<${RewardPolicy.name}>`, 'RewardPolicy');

        await this.requestAccountDecoding(account);

        await this.sendAndFollowExtrinsic(
            account,
            apiModuleByGroup[this.group],
            'fillOpening',
            [
                new OpeningId(opening.wgOpeningId),
                new ApplicationIdSet(applicationIds),
                rewardPolicyOpt
            ]
        );

        this.log(chalk.green(`Opening ${chalk.white(opening.wgOpeningId)} succesfully filled!`));
        this.log(
            chalk.green('Accepted working group application IDs: ') +
            chalk.white(applicationIds.length ? applicationIds.join(chalk.green(', ')) : 'NONE')
        );
    }
}
