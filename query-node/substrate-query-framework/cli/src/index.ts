import { build } from 'gluegun';

export const cli = build()
    .brand('warthog')
    .src(`${__dirname}/../node_modules/warthog/dist/cli`)
    .help() // provides default for help, h, --help, -h
    .version() // provides default for version, v, --version, -v
    .create();

export { run } from '@oclif/command'
