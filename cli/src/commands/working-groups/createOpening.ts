import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase';
import { HRTStruct } from '../../Types';
import chalk from 'chalk';
import { flags } from '@oclif/command';
import { ApiMethodInputArg } from '../../base/ApiCommandBase';
import { schemaValidator } from '@joystream/types/lib/hiring';
import { apiModuleByGroup } from '../../Api';

export default class WorkingGroupsCreateOpening extends WorkingGroupsCommandBase {
    static description = 'Create working group opening (requires lead access)';
    static flags = {
        ...WorkingGroupsCommandBase.flags,
        useDraft: flags.boolean({
            char: 'd',
            description:
                "Whether to create the opening from existing draft.\n"+
                "If provided without --draftName - the list of choices will be displayed."
        }),
        draftName: flags.string({
            char: 'n',
            description:
                'Name of the draft to create the opening from.',
            dependsOn: ['useDraft']
        }),
        createDraftOnly: flags.boolean({
            char: 'c',
            description:
                'If provided - the extrinsic will not be executed. Use this flag if you only want to create a draft.'
        }),
        skipPrompts: flags.boolean({
            char: 's',
            description:
                "Whether to skip all prompts when adding from draft (will use all default values)",
            dependsOn: ['useDraft'],
            exclusive: ['createDraftOnly']
        })
    };

    async run() {
        const account = await this.getRequiredSelectedAccount();
        // lead-only gate
        await this.getRequiredLead();

        const { flags } = this.parse(WorkingGroupsCreateOpening);

        let defaultValues: ApiMethodInputArg[] | undefined = undefined;
        if (flags.useDraft) {
            const draftName = flags.draftName || await this.promptForOpeningDraft();
            defaultValues =  await this.loadOpeningDraftParams(draftName);
        }

        if (!flags.skipPrompts) {
            const module = apiModuleByGroup[this.group];
            const method = 'addOpening';
            const jsonArgsMapping = { 'human_readable_text': { struct: HRTStruct, schemaValidator } };

            let saveDraft = false, params: ApiMethodInputArg[];
            if (flags.createDraftOnly) {
                params = await this.promptForExtrinsicParams(module, method, jsonArgsMapping, defaultValues);
                saveDraft = true;
            }
            else {
                await this.requestAccountDecoding(account); // Prompt for password

                params = await this.buildAndSendExtrinsic(
                    account,
                    module,
                    method,
                    jsonArgsMapping,
                    defaultValues,
                    true
                );

                this.log(chalk.green('Opening succesfully created!'));

                saveDraft = await this.simplePrompt({
                    message: 'Do you wish to save this opening as draft?',
                    type: 'confirm'
                });
            }

            if (saveDraft) {
                const draftName = await this.promptForNewOpeningDraftName();
                this.saveOpeningDraft(draftName, params);

                this.log(chalk.green(`Opening draft ${ chalk.white(draftName) } succesfully saved!`));
            }
        }
        else {
            await this.requestAccountDecoding(account); // Prompt for password
            this.log(chalk.white('Sending the extrinsic...'));
            await this.sendExtrinsic(account, apiModuleByGroup[this.group], 'addOpening', defaultValues!);
            this.log(chalk.green('Opening succesfully created!'));
        }
    }
}
