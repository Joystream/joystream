import Config from './../Config'
import { State } from './../StateKeeper'


export default class JoyNode {
    constructor(config: Config) {

    }

    static async build(config: Config): Promise<JoyNode> {
        return new JoyNode(config);
    }

    async run(state: State) {

    }
}