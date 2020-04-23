const cli = require('warthog/dist/cli/cli');
import { Command } from '@oclif/command';

import { ormconfig } from '../helpers/ormconfig';
import { createDir, createFile } from '../utils/utils';

export default class New extends Command {
  static description = 'Create grapqhl server and event processor';
  static joystreamQueryNode = 'joystream-query-node';
  static substrateQueryNode = 'substrate-query-node';
  static schemaFile = 'schema.json';
  static ormconfigFile = 'ormconfig.json';

  static args = [
    {
      name: 'project_name',
    },
  ];

  async run() {
    const { args } = this.parse(New);
    const project_name = args.project_name;

    if (!project_name) this.error('Please provide project name');
    createDir(project_name);
    process.chdir(project_name);

    // Create directories for graphql server and event processor
    createDir(New.joystreamQueryNode);
    createDir(New.substrateQueryNode);

    this.generateSubstrateQueryNodeDirs();

    // Change working to joystream-query-node
    process.chdir(New.joystreamQueryNode);
    // Create joystream-query-node/schema.json file
    createFile(New.schemaFile, '[{}]');
    // Create warthog graphql server
    cli.run(`new ${project_name}`);
  }

  generateSubstrateQueryNodeDirs() {
    // substrate-query-node/src
    const srcDir = [New.substrateQueryNode, 'src'].join('/');
    const ormConfigFile = [New.substrateQueryNode, New.ormconfigFile].join('/');

    createDir(srcDir);
    createFile(ormConfigFile, JSON.stringify(ormconfig));
  }
}
