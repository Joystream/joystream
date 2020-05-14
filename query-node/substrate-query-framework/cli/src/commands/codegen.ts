import * as path from 'path';
import * as fs from 'fs-extra';
import * as dotenv from 'dotenv';
import * as Mustache from 'mustache';
import { readFileSync, copyFileSync } from 'fs-extra';
import { Command, flags } from '@oclif/command';
import { execSync } from 'child_process';

import { createDir, getTemplatePath, createFile } from '../utils/utils';
import { formatWithPrettier } from '../helpers/formatter';
import WarthogWrapper from '../helpers/WarthogWrapper';
import { getTypeormConfig, getTypeormModelGeneratorConnectionConfig, createSavedEntityEventTable } from '../helpers/db';

export default class Codegen extends Command {
  static description = 'Code generator';
  static generatedFolderName = 'generated';

  static flags = {
    schema: flags.string({ char: 's', description: 'Schema path', default: '../../schema.graphql' })
  };

  async run() {
    dotenv.config();

    const { flags } = this.parse(Codegen);

    const generatedFolderPath = path.resolve(process.cwd(), Codegen.generatedFolderName);
    createDir(generatedFolderPath);

    // Change directory to generated
    process.chdir(generatedFolderPath);

    // Create warthog graphql server
    await this.createGraphQLServer(flags.schema);

    // Create block indexer
    await this.createBlockIndexer();
  }

  async createGraphQLServer(schemaPath: string) {
    const goBackDir = process.cwd();

    const warthogProjectName = 'graphql-server';
    const warthogProjectPath = path.resolve(goBackDir, warthogProjectName);

    createDir(warthogProjectPath);
    process.chdir(warthogProjectPath);

    const warthogWrapper = new WarthogWrapper(this, schemaPath);
    await warthogWrapper.run();

    process.chdir(goBackDir);
  }

  async createBlockIndexer() {
    // Take process where back at the end of the function execution
    const goBackDir = process.cwd();

    // Block indexer folder path
    const indexerPath = path.resolve(goBackDir, 'indexer');

    createDir(indexerPath);
    process.chdir(indexerPath);

    // Create index.ts file
    let indexFileContent = readFileSync(getTemplatePath('index-builder-entry.mst'), 'utf8');
    indexFileContent = Mustache.render(indexFileContent, {
      packageName: process.env.TYPE_REGISTER_PACKAGE_NAME,
      typeRegistrator: process.env.TYPE_REGISTER_FUNCTION
    });
    createFile(path.resolve('index.ts'), formatWithPrettier(indexFileContent));

    // Create package.json
    copyFileSync(getTemplatePath('indexer.package.json'), path.resolve(process.cwd(), 'package.json'));

    // Create .env file for typeorm database connection
    fs.writeFileSync('.env', getTypeormConfig());

    // Create
    copyFileSync(getTemplatePath('indexer.tsconfig.json'), path.resolve(process.cwd(), 'tsconfig.json'));

    this.log('Installing dependendies for indexer...');
    execSync('yarn install');
    execSync(`yarn add ${process.env.TYPE_REGISTER_PACKAGE_NAME}`);
    this.log('done...');

    this.log('Generating typeorm db entities...');
    await createSavedEntityEventTable();
    execSync(getTypeormModelGeneratorConnectionConfig());
    this.log('done...');

    process.chdir(goBackDir);
  }
}
