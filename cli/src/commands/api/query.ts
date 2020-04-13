import Api from '../../Api';
import Command, { flags } from '@oclif/command';
import { displayNameValueTable } from '../../helpers/display';
import { ApiPromise } from '@polkadot/api';
import { Text } from '@polkadot/types';
import { QueryableModuleStorage } from '@polkadot/api/types';
import ExitCodes from '../../ExitCodes';
import chalk from 'chalk';

// This command flags
type ApiQueryFlags = {
    module: string,
    method: string,
    makeCall: boolean,
    callArgs: string
};

// Optional metadata attached to api.query[module][method] (this type is used to force correct TS compatibility)
type OptionalApiMeta = { meta: { documentation: Text | undefined } | undefined };

export default class ApiQuery extends Command {
    static description =
        'Lists available node API query modules/methods and/or their documentation(s), '+
        'or calls one of the API query methods (depending on provided arguments and flags)';

    static examples = [
        '$ api:query',
        '$ api:query --module=members',
        '$ api:query --module=members --method=memberProfile',
        '$ api:query --module=members --method=memberProfile -c -a=1',
    ];

    static flags = {
        module: flags.string({
            description:
                'Specifies the query module, ie. "system", "staking" etc.\n'+
                'If provided without "method" flag: lists methods in that module along with descriptions.\n'+
                'If not provided: lists all available api.query modules.',
        }),
        method: flags.string({
            description: 'Specifies the api method to call/describe.',
            dependsOn: ['module']
        }),
        makeCall: flags.boolean({
            char: 'c',
            description: 'Provide this flag if you want to execute the call, instead of displaying the method description (which is default)',
            dependsOn: ['module', 'method']
        }),
        callArgs: flags.string({
            char: 'a',
            description: 'Specify the arguments to use when calling a method. Separate them with a comma, ie. "-a=arg1,arg2"',
            dependsOn: ['module', 'method', 'makeCall']
        })
    };

    getApiMethodWithDescription(apiModule: QueryableModuleStorage<"promise">, methodName: string) {
        // Api method optionally has "meta" object attached, but TS is not aware of this unless we do it like this:
        let apiMethodOrig = apiModule[methodName];
        let apiMethod = <typeof apiMethodOrig & OptionalApiMeta> apiMethodOrig;

        if (!apiMethod) this.error('Such method was not found', { exit: ExitCodes.InvalidInput });

        return {
            apiMethod,
            description: (apiMethod.meta && apiMethod.meta.documentation) ?
                apiMethod.meta.documentation.toString()
                : '[ No description available ]'
        };
    }

    async run() {
        const api: Api = await Api.create();
        const apiPromise: ApiPromise = api.getOriginalApi();
        const flags: ApiQueryFlags = <ApiQueryFlags> this.parse(ApiQuery).flags;

        if (flags.module) {
            let apiModule = apiPromise.query[flags.module];
            if (!apiModule) this.error('Such module was not found', { exit: ExitCodes.InvalidInput });
            if (flags.method) {
                const { apiMethod, description } = this.getApiMethodWithDescription(apiModule, flags.method);
                if (flags.makeCall) {
                    // Call the method
                    const args: string[] = flags.callArgs ? flags.callArgs.split(',') : [];
                    const result = await apiMethod(...args);
                    console.log('Original result:', result);
                    console.log('To string:', result.toString());
                }
                else {
                    // Just show description (default)
                    this.log(description);
                }
            }
            else {
                // Only the module was specified - list methods and descriptions
                const rows = Object.keys(apiModule).map((key: string) => {
                    const { description } = this.getApiMethodWithDescription(apiModule, key);
                    return { name: key, value: description };
                });
                displayNameValueTable(rows);
            }
        }
        else {
            // No module specified - list available modules
            this.log(chalk.bold.white('Available modules:'));
            this.log(Object.keys(apiPromise.query).map(key => chalk.white(key)).join('\n'));
        }

        this.exit(ExitCodes.OK);
    }
  }
