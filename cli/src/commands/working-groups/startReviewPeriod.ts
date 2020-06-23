import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase';
import _ from 'lodash';
import { OpeningStatus } from '../../Types';
import ExitCodes from '../../ExitCodes';
import { apiModuleByGroup } from '../../Api';
import { WorkerOpeningId } from '@joystream/types/lib/working-group';

export default class WorkingGroupsStartReviewPeriod extends WorkingGroupsCommandBase {
    static description = 'Changes the status of active opening to "In review". Requires lead access.';
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
        const { args } = this.parse(WorkingGroupsStartReviewPeriod);

        const account = await this.getRequiredSelectedAccount();
        // Lead-only gate
        await this.getRequiredLead();

        const opening = await this.getApi().groupOpening(this.group, parseInt(args.workerOpeningId));

        if (opening.stage.status !== OpeningStatus.AcceptingApplications) {
            this.error('This opening is not in "Accepting Applications" stage!', { exit: ExitCodes.InvalidInput });
        }

        await this.requestAccountDecoding(account);

        await this.sendAndFollowExtrinsic(
            account,
            apiModuleByGroup[this.group],
            'beginWorkerApplicantReview',
            [ new WorkerOpeningId(opening.workerOpeningId) ]
        );
    }
  }
