import StateAwareCommandBase from '../../base/StateAwareCommandBase';
import chalk from 'chalk';

type ApiSetUriArgs = { uri: string };

export default class ApiSetUri extends StateAwareCommandBase {
    static description = 'Set api WS provider uri';
    static args = [
        {
            name: 'uri',
            required: true,
            description: 'Uri of the node api WS provider'
        }
    ];

    async run() {
        const args: ApiSetUriArgs = <ApiSetUriArgs> this.parse(ApiSetUri).args;
        await this.setPreservedState({ apiUri: args.uri });
        this.log(chalk.greenBright('Api uri successfuly changed! New uri: ') + chalk.white(args.uri))
    }
  }
