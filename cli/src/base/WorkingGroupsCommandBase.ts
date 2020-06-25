import ExitCodes from '../ExitCodes';
import AccountsCommandBase from './AccountsCommandBase';
import { flags } from '@oclif/command';
import { WorkingGroups, AvailableGroups, NamedKeyringPair, GroupLeadWithProfile, GroupMember, GroupOpening, GroupApplication } from '../Types';
import { apiModuleByGroup } from '../Api';
import { CLIError } from '@oclif/errors';
import inquirer from 'inquirer';
import { ApiMethodInputArg } from './ApiCommandBase';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import { ApplicationStageKeys } from '@joystream/types/lib/hiring';

const DEFAULT_GROUP = WorkingGroups.StorageProviders;
const DRAFTS_FOLDER = '/opening-drafts';

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
    async getRequiredLead(): Promise<GroupLeadWithProfile> {
        let selectedAccount: NamedKeyringPair = await this.getRequiredSelectedAccount();
        let lead = await this.getApi().groupLead(this.group);

        if (!lead || lead.lead.role_account_id.toString() !== selectedAccount.address) {
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

    async promptForApplicationsToAccept(opening: GroupOpening): Promise<number[]> {
        const acceptableApplications = opening.applications.filter(a => a.stage === ApplicationStageKeys.Active);
        const acceptedApplications = await this.simplePrompt({
            message: 'Select succesful applicants',
            type: 'checkbox',
            choices: acceptableApplications.map(a => ({
                name: ` ${a.wgApplicationId}: ${a.member?.handle.toString()}`,
                value: a.wgApplicationId,
            }))
        });

        return acceptedApplications;
    }

    async promptForNewOpeningDraftName() {
        let
            draftName: string = '',
            fileExists: boolean = false,
            overrideConfirmed: boolean = false;

        do {
            draftName = await this.simplePrompt({
                type: 'input',
                message: 'Provide the draft name',
                validate: val => (typeof val === 'string' && val.length >= 1) || 'Draft name is required!'
            });

            fileExists = fs.existsSync(this.getOpeningDraftPath(draftName));
            if (fileExists) {
                overrideConfirmed = await this.simplePrompt({
                    type: 'confirm',
                    message: 'Such draft already exists. Do you wish to override it?',
                    default: false
                });
            }
        } while(fileExists && !overrideConfirmed);

        return draftName;
    }

    async promptForOpeningDraft() {
        let draftFiles: string[] = [];
        try {
            draftFiles = fs.readdirSync(this.getOpeingDraftsPath());
        }
        catch(e) {
            throw this.createDataReadError(DRAFTS_FOLDER);
        }
        if (!draftFiles.length) {
            throw new CLIError('No drafts available!', { exit: ExitCodes.FileNotFound });
        }
        const draftNames = draftFiles.map(fileName => _.startCase(fileName.replace('.json', '')));
        const selectedDraftName = await this.simplePrompt({
            message: 'Select a draft',
            type: 'list',
            choices: draftNames
        });

        return selectedDraftName;
    }

    loadOpeningDraftParams(draftName: string) {
        const draftFilePath = this.getOpeningDraftPath(draftName);
        const params = this.extrinsicArgsFromDraft(
            apiModuleByGroup[this.group],
            'addOpening',
            draftFilePath
        );

        return params;
    }

    getOpeingDraftsPath() {
        return path.join(this.getAppDataPath(), DRAFTS_FOLDER);
    }

    getOpeningDraftPath(draftName: string) {
        return path.join(this.getOpeingDraftsPath(), _.snakeCase(draftName)+'.json');
    }

    saveOpeningDraft(draftName: string, params: ApiMethodInputArg[]) {
        const paramsJson = JSON.stringify(
            params.map(p => p.toJSON()),
            null,
            2
        );

        try {
            fs.writeFileSync(this.getOpeningDraftPath(draftName), paramsJson);
        } catch(e) {
            throw this.createDataWriteError(DRAFTS_FOLDER);
        }
    }

    private initOpeningDraftsDir(): void {
        if (!fs.existsSync(this.getOpeingDraftsPath())) {
            fs.mkdirSync(this.getOpeingDraftsPath());
        }
    }

    async init() {
        await super.init();
        try {
            this.initOpeningDraftsDir();
        } catch (e) {
            throw this.createDataDirInitError();
        }
        const { flags } = this.parse(this.constructor as typeof WorkingGroupsCommandBase);
        if (!AvailableGroups.includes(flags.group as any)) {
            throw new CLIError(`Invalid group! Available values are: ${AvailableGroups.join(', ')}`, { exit: ExitCodes.InvalidInput });
        }
        this.group = flags.group as WorkingGroups;
    }
}
