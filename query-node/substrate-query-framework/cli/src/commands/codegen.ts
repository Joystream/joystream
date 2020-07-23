import * as path from 'path';
import * as fs from 'fs-extra';
import * as dotenv from 'dotenv';
import * as Mustache from 'mustache';
import { readFileSync } from 'fs-extra';
import { Command, flags } from '@oclif/command';

import cli from 'cli-ux';
import execa = require('execa');

import { createDir, getTemplatePath, createFile } from '../utils/utils';
import { formatWithPrettier } from '../helpers/formatter';
import WarthogWrapper from '../helpers/WarthogWrapper';
import { getTypeormConfig } from '../helpers/db';
import { upperFirst } from 'lodash';
import Listr = require('listr');

export default class Codegen extends Command {
  static description = 'Code generator';
  static generatedFolderName = 'generated';

  static flags = {
    schema: flags.string({ char: 's', description: 'Schema path', default: '../../schema.graphql' }),
    // pass --no-indexer to skip indexer generation
    indexer: flags.boolean({ char: 'i', allowNo: true, description: 'Generate Indexer', default: true }),
    // pass --no-graphql to skip graphql generation
    graphql: flags.boolean({ char: 'g', allowNo: true, description: 'Generate GraphQL server', default: true }),

    dbschema: flags.boolean({ char: 'd', description: 'Create the DB schema (use with caution!)', default: false }),
  };

  async run(): Promise<void> {
    dotenv.config();

    const { flags } = this.parse(Codegen);

    const generatedFolderPath = path.resolve(process.cwd(), Codegen.generatedFolderName);

    createDir(generatedFolderPath);

    // Change directory to generated
    process.chdir(generatedFolderPath);

    // Create warthog graphql server
    if (flags.graphql) {
      cli.action.start('Generating the GraphQL server');
      await this.createGraphQLServer(flags.schema, flags.dbschema);
      cli.action.stop();
    }

    // Create block indexer
    if (flags.indexer) {
      cli.action.start('Generating the Indexer');
      await this.createBlockIndexer();
      cli.action.stop();
    }
  }

  async createGraphQLServer(schemaPath: string, syncdb: boolean): Promise<void> {
    const goBackDir = process.cwd();

    const warthogProjectName = 'graphql-server';
    const warthogProjectPath = path.resolve(goBackDir, warthogProjectName);

    createDir(warthogProjectPath);

    process.chdir(warthogProjectPath);

    const warthogWrapper = new WarthogWrapper(this, schemaPath);
    await warthogWrapper.run();

    if (syncdb) {
      await warthogWrapper.generateDB();
    }

    process.chdir(goBackDir);
  }

  async createBlockIndexer(): Promise<void> {
    // Take process where back at the end of the function execution
    const goBackDir = process.cwd();

    // Block indexer folder path
    const indexerPath = path.resolve(goBackDir, 'indexer');

    createDir(indexerPath);
    process.chdir(indexerPath);

    const generateFiles = {
      title: 'Generate source files',
      task: async () => {
        let indexFileContent = readFileSync(getTemplatePath('index-builder-entry.mst'), 'utf8');
        indexFileContent = Mustache.render(indexFileContent, {
          packageName: process.env.TYPE_REGISTER_PACKAGE_NAME,
          typeRegistrator: process.env.TYPE_REGISTER_FUNCTION,
          projectName: upperFirst(process.env.PROJECT_NAME),
        });
        createFile(path.resolve('index.ts'), formatWithPrettier(indexFileContent));

        // Create package.json
        await fs.copyFile(getTemplatePath('indexer.package.json'), path.resolve(process.cwd(), 'package.json'));

        // Create .env file for typeorm database connection
        await fs.writeFile('.env', getTypeormConfig());

        // Create
        await fs.copyFile(getTemplatePath('indexer.tsconfig.json'), path.resolve(process.cwd(), 'tsconfig.json'));
      },
    };
    // Create index.ts file

    const installDeps = {
      title: 'Install dependencies for the Indexer',
      task: async () => {
        await execa('yarn', ['install']);
        if (process.env.TYPE_REGISTER_PACKAGE_NAME) {
          await execa('yarn', ['add', `${process.env.TYPE_REGISTER_PACKAGE_NAME}`]);
        }
      },
    };

    const listr = new Listr([generateFiles, installDeps]);
    await listr.run();

    process.chdir(goBackDir);
  }
}
