#!/usr/bin/env node
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/unbound-method */

// Required imports

import { Command } from 'commander';

import Config from './Config';
import { StateKeeper, State } from './state/StateKeeper'
import JoyNode from './joynode/QueryNode'
import ESUploader from './esearch/ESUploader'

const logger = require('log4js').getLogger('main')
const command = new Command();

async function main() {
    command
        .version('0.0.1')
        .description("Joystream ElasticSearch import tool")
        .option('-c, --config <file>', 'path to config', 'config.yml')
        .option('-d --debug', 'debug')
        .parse(process.argv);

    const config = new Config(command.config);
    // TODO: move to a sep init class, catch init errors

    // responsible for uploading docs to ES
    const esUploader = new ESUploader(config);
    // responsible for keeping track of the pipeline state 
    const stateKeeper = new StateKeeper(config);
    // responsible for emitting the blockchain events & data
    const joyNode = new JoyNode()
    await joyNode.build(config);

    const state: State = await esUploader.restore();
    stateKeeper.state = state;

    if (stateKeeper.shouldBootstrap()) {
        stateKeeper.state = await esUploader.bootstrap(joyNode.bootstrapper.fetch())
    }

    await joyNode.start(state);
    for await (const state of esUploader.sync(joyNode.producer.blocks())) {
        stateKeeper.state = state;
    }


    process.on('SIGINT', async () => {
        await joyNode.stop();
    });

}

main().catch((e) => logger.warn(e)).finally(() => process.exit());