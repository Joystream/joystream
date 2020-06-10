/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { build } from 'gluegun';

export const cli = build()
    .brand('warthog')
    .src(`${__dirname}/../node_modules/warthog/dist/cli`)
    .plugins(`${__dirname}/../node_modules`, { matching: 'warthog-*', hidden: true })
    .help() // provides default for help, h, --help, -h
    .version() // provides default for version, v, --version, -v
    .create();

export { run } from '@oclif/command'
