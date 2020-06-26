import ExitCodes from '../ExitCodes';
import AccountsCommandBase from './AccountsCommandBase';
import { flags } from '@oclif/command';
import { WorkingGroups, AvailableGroups, NamedKeyringPair, GroupMember } from '../Types';
import { CLIError } from '@oclif/errors';
import inquirer from 'inquirer';

const DEFAULT_GROUP = WorkingGroups.StorageProviders;

/**
 * Abstract base class for commands related to working groups
 */
export default abstract class WorkingGroupsCommandBase extends AccountsCommandBase {
    group: WorkingGroups = DEFAULT_GROUP;

    static flags = {
        group: flags.string({
            char: 'g',
            description:
                "The working group context in which the command should be executed\n" +
                `Available values are: ${AvailableGroups.join(', ')}.`,
            required: true,
            default: DEFAULT_GROUP
        }),
    };

    // Use when lead access is required in given command
    async getRequiredLead(): Promise<GroupMember> {
        let selectedAccount: NamedKeyringPair = await this.getRequiredSelectedAccount();
        let lead = await this.getApi().groupLead(this.group);

        if (!lead || lead.roleAccount.toString() !== selectedAccount.address) {
            this.error('Lead access required for this command!', { exit: ExitCodes.AccessDenied });
        }

        return lead;
    }

    // Use when worker access is required in given command
    async getRequiredWorker(): Promise<GroupMember> {
        let selectedAccount: NamedKeyringPair = await this.getRequiredSelectedAccount();
        let groupMembers = await this.getApi().groupMembers(this.group);
        let groupMembersByAccount = groupMembers.filter(m => m.roleAccount.toString() === selectedAccount.address);

        if (!groupMembersByAccount.length) {
            this.error('Worker access required for this command!', { exit: ExitCodes.AccessDenied });
        }
        else if (groupMembersByAccount.length === 1) {
            return groupMembersByAccount[0];
        }
        else {
            return await this.promptForWorker(groupMembersByAccount);
        }
    }

    async promptForWorker(groupMembers: GroupMember[]): Promise<GroupMember> {
        const { choosenWorkerIndex } = await inquirer.prompt([{
            name: 'chosenWorkerIndex',
            message: 'Choose the worker to execute the command as',
            type: 'list',
            choices: groupMembers.map((groupMember, index) => ({
                name: `Worker ID ${ groupMember.workerId.toString() }`,
                value: index
            }))
        }]);

        return groupMembers[choosenWorkerIndex];
    }

    async init() {
        await super.init();
        const { flags } = this.parse(WorkingGroupsCommandBase);
        if (!AvailableGroups.includes(flags.group as any)) {
            throw new CLIError('Invalid group!', { exit: ExitCodes.InvalidInput });
        }
        this.group = flags.group as WorkingGroups;
    }
}
