import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase';
import _ from 'lodash';
import { OpeningStatus } from '../../Types';
import ExitCodes from '../../ExitCodes';
import { apiModuleByGroup } from '../../Api';
import { createType } from '@polkadot/types';

export default class WorkingGroupsStartAcceptingApplications extends WorkingGroupsCommandBase {
    static description = 'Changes the status of pending opening to "Accepting applications"';
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
        const { args } = this.parse(WorkingGroupsStartAcceptingApplications);

        const account = await this.getRequiredSelectedAccount();
        // Lead-only gate
        await this.getRequiredLead();

        const opening = await this.getApi().groupOpening(this.group, parseInt(args.workerOpeningId));

        if (opening.stage.status !== OpeningStatus.WaitingToBegin) {
            this.error('This opening is not in "Waiting To Begin" stage!', { exit: ExitCodes.InvalidInput });
        }

        await this.requestAccountDecoding(account);

        await this.sendAndFollowExtrinsic(
            account,
            apiModuleByGroup[this.group],
            'acceptWorkerApplications',
            [ createType('WorkerOpeningId' as any, opening.workerOpeningId) ]
        );
    }
  }
