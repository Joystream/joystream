import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase';
import { displayHeader, displayNameValueTable, displayTable } from '../../helpers/display';
import { formatBalance } from '@polkadot/util';
import { shortAddress } from '../../helpers/display';
import chalk from 'chalk';

export default class WorkingGroupsOverview extends WorkingGroupsCommandBase {
    static description = 'Shows an overview of given working group (current lead and workers)';
    static flags = {
        ...WorkingGroupsCommandBase.flags,
    };

    async run() {
        const lead = await this.getApi().groupLead(this.group);
        const members = await this.getApi().groupMembers(this.group);

        displayHeader('Group lead');
        if (lead) {
            displayNameValueTable([
                { name: 'Member id:', value: lead.memberId.toString() },
                { name: 'Member handle:', value: lead.profile.handle.toString() },
                { name: 'Role account:', value: lead.roleAccount.toString() },
            ]);
        }
        else {
            this.log(chalk.yellow('No lead assigned!'));
        }

        displayHeader('Members');
        const membersRows = members.map(m => ({
            'Worker id': m.workerId.toString(),
            'Member id': m.memberId.toString(),
            'Member handle': m.profile.handle.toString(),
            'Stake': formatBalance(m.stake),
            'Earned': formatBalance(m.reward?.totalRecieved),
            'Role account': shortAddress(m.roleAccount)
        }));
        displayTable(membersRows, 5);
    }
  }
