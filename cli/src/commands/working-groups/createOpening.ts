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
        skipPrompts: flags.boolean({
            char: 's',
            description:
                "Whether to skip all prompts when adding from draft (will use all default values)",
            dependsOn: ['useDraft']
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

        await this.requestAccountDecoding(account); // Prompt for password
        if (!flags.skipPrompts) {
            const params = await this.buildAndSendExtrinsic(
                account,
                apiModuleByGroup[this.group],
                'addWorkerOpening',
                { 'human_readable_text': { struct: HRTStruct, schemaValidator } },
                defaultValues
            );

            const saveDraft = await this.simplePrompt({
                message: 'Do you wish to save this opportunity as draft?',
                type: 'confirm'
            });

            if (saveDraft) {
                const draftName = await this.promptForNewOpeningDraftName();
                this.saveOpeningDraft(draftName, params);

                this.log(chalk.green(`Opening draft ${ chalk.white(draftName) } succesfully saved!`));
            }
        }
        else {
            this.log(chalk.white('Sending the extrinsic...'));
            await this.sendExtrinsic(account, apiModuleByGroup[this.group], 'addWorkerOpening', defaultValues!);
            this.log(chalk.green('Opening succesfully created!'));
        }
    }
  }
