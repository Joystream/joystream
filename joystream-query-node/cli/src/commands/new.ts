import * as fs from 'fs-extra';
import * as path from 'path';
const cli = require('warthog/dist/cli/cli');
import { Command } from '@oclif/command';

import { createDir, createFile } from '../utils/utils';
import { formatWithPrettier } from '../helpers/formatter';

export default class New extends Command {
  static description = 'Create grapqhl server and event processor';
  static joystreamQueryNode = 'joystream-query-node';
  static substrateQueryNode = 'substrate-query-node';
  static schemaFile = 'schema.json';

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

    this.generateSubstrateQueryNodeDirs(project_name);

    // Change working to joystream-query-node
    process.chdir(New.joystreamQueryNode);
    // Create joystream-query-node/schema.json file
    createFile(New.schemaFile, '[{}]');
    // Create warthog graphql server
    cli.run(`new ${project_name}`);
  }

  generateSubstrateQueryNodeDirs(projectName: string) {
    // substrate-query-node/src
    const srcDir = [New.substrateQueryNode, 'src'].join('/');

    createDir(srcDir);

    let ormconfigTemplate: any;
    ormconfigTemplate = fs.readFileSync(
      path.resolve(__dirname, '..', 'helpers', 'templates', 'ormconfig.json'),
      'utf8'
    );
    try {
      ormconfigTemplate = JSON.parse(ormconfigTemplate);

      ormconfigTemplate[0]['database'] = projectName;
    } catch (error) {
      this.error('ormconfig.json template is not a valid json file.');
    }

    const ormconfigFilePath = path.resolve(
      path.resolve(process.cwd(), New.substrateQueryNode, 'ormconfig.json')
    );
    ormconfigTemplate = JSON.stringify(ormconfigTemplate);
    createFile(ormconfigFilePath, ormconfigTemplate);
  }
}
