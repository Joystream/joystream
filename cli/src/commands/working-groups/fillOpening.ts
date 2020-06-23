import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase';
import _ from 'lodash';
import { OpeningStatus } from '../../Types';
import ExitCodes from '../../ExitCodes';
import { apiModuleByGroup } from '../../Api';
import { WorkerOpeningId, WorkerApplicationIdSet } from '@joystream/types/lib/working-group';
import { RewardPolicy } from '@joystream/types/lib/content-working-group';

export default class WorkingGroupsFillOpening extends WorkingGroupsCommandBase {
    static description = 'Allows filling worker opening that\'s currently in review. Requires lead access.';
    static args = [
        {
            name: 'workerOpeningId',
            required: true,
            description: 'Worker Opening ID'
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

        const opening = await this.getApi().groupOpening(this.group, parseInt(args.workerOpeningId));

        if (opening.stage.status !== OpeningStatus.InReview) {
            this.error('This opening is not in the Review stage!', { exit: ExitCodes.InvalidInput });
        }

        const applications = await this.promptForApplicationsToAccept(opening);
        const rewardPolicyOpt = await this.promptForParam(`Option<${RewardPolicy.name}>`, 'RewardPolicy');

        await this.requestAccountDecoding(account);

        await this.sendAndFollowExtrinsic(
            account,
            apiModuleByGroup[this.group],
            'fillWorkerOpening',
            [
                new WorkerOpeningId(opening.workerOpeningId),
                new WorkerApplicationIdSet(applications),
                rewardPolicyOpt
            ]
        );
    }
  }
