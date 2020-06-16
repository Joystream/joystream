import ExitCodes from '../ExitCodes';
import Command from '@oclif/command';
import inquirer, { DistinctQuestion } from 'inquirer';

/**
 * Abstract base class for pretty much all commands
 * (prevents console.log from hanging the process and unifies the default exit code)
 */
export default abstract class DefaultCommandBase extends Command {
    protected indentGroupsOpened = 0;

    openIndentGroup() {
        console.group();
        ++this.indentGroupsOpened;
    }

    closeIndentGroup() {
        console.groupEnd();
        --this.indentGroupsOpened;
    }

    async simplePrompt(question: DistinctQuestion) {
        const { result } = await inquirer.prompt([{
            ...question,
            name: 'result',
            // prefix = 2 spaces for each group - 1 (because 1 is always added by default)
            prefix: Array.from(new Array(this.indentGroupsOpened)).map(() => '  ').join('').slice(1)
        }]);

        return result;
    }

    async finally(err: any) {
        // called after run and catch regardless of whether or not the command errored
        // We'll force exit here, in case there is no error, to prevent console.log from hanging the process
        if (!err) this.exit(ExitCodes.OK);
        super.finally(err);
    }
}
