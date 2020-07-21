import ExitCodes from '../ExitCodes';
import Command from '@oclif/command';

/**
 * Abstract base class for pretty much all commands
 * (prevents console.log from hanging the process and unifies the default exit code)
 */
export default abstract class DefaultCommandBase extends Command {
    async finally(err: any) {
        // called after run and catch regardless of whether or not the command errored
        // We'll force exit here, in case there is no error, to prevent console.log from hanging the process
        if (!err) this.exit(ExitCodes.OK);
        super.finally(err);
    }
}
