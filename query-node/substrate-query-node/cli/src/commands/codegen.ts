import * as path from 'path';
import { readFileSync, existsSync } from 'fs-extra';
import { Command } from '@oclif/command';
const warthogCli = require('warthog/dist/cli/cli');
const { exec } = require('child_process');

import { createDir, getTemplatePath, createFile, copyFiles } from '../utils/utils';
import { formatWithPrettier } from '../helpers/formatter';
import WarthogWrapper from '../helpers/WarthogWrapper';

export default class Codegen extends Command {
  static description = 'Code generator';
  static generatedFolderName = 'generated';

  async run() {
    const generatedFolderPath = path.resolve(process.cwd(), Codegen.generatedFolderName);
    createDir(generatedFolderPath);

    // Change directory to generated
    process.chdir(generatedFolderPath);

    // Create warthog graphql server
    await this.createGraphQLServer();

    // Create block indexer
    await this.createBlockIndexer();
  }

  async createGraphQLServer() {
    const goBackDir = process.cwd();

    const warthogProjectName = 'graphql-server';
    const warthogProjectPath = path.resolve(goBackDir, warthogProjectName);

    createDir(warthogProjectPath);
    process.chdir(warthogProjectPath);

    const warthogWrapper = new WarthogWrapper(this);
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
    const indexFileContent = formatWithPrettier(readFileSync(getTemplatePath('index-builder-entry.mst'), 'utf8'));
    createFile(path.resolve('index.ts'), indexFileContent);

    // Create package.json
    copyFiles(getTemplatePath('indexer.package.json'), path.resolve(process.cwd(), 'package.json'));

    process.chdir(goBackDir);
  }
}
