import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase';
import { displayCollapsedRow, displayHeader } from '../../helpers/display';
import _ from 'lodash';
import chalk from 'chalk';

export default class WorkingGroupsApplication extends WorkingGroupsCommandBase {
    static description = 'Shows an overview of given application by Worker Application ID';
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
        const { args } = this.parse(WorkingGroupsApplication);

        const application = await this.getApi().groupApplication(this.group, parseInt(args.workerApplicationId));

        displayHeader('Human readable text');
        this.jsonPrettyPrint(application.humanReadableText);

        displayHeader(`Details`);
        const applicationRow = {
            'Worker application ID': application.workerApplicationId,
            'Application ID': application.applicationId,
            'Member handle': application.member?.handle.toString() || chalk.red('NONE'),
            'Role account': application.roleAccout.toString(),
            'Stage': application.stage,
            'Application stake': application.stakes.application,
            'Role stake': application.stakes.role,
            'Total stake': Object.values(application.stakes).reduce((a, b) => a + b)
        };
        displayCollapsedRow(applicationRow);
    }
}
