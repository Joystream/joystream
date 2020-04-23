import * as fs from 'fs-extra';
import * as path from 'path';
import { Command, flags } from '@oclif/command';

import { copyFiles, createDir, createFile } from '../utils/utils';
import { formatWithPrettier } from '../helpers/formatter';

export default class Indexer extends Command {
  static description = 'Block indexer';

  static flags = {
    update: flags.boolean({
      char: 'u',
      description: 'Update index builder to add or remove events',
    }),
    create: flags.boolean({
      char: 'c',
      description: 'Generate index-builder and query-node directories with necessary files',
    }),
  };

  async run() {
    const { flags } = this.parse(Indexer);

    if (flags.create) {
      this.create();
      this.log('Creating index-builder and query-node in src');
      this.log('done...');
    }

    // TODO: Update index builder
    if (flags.update) {
    }

    // const node = new QueryNodeManager(process);
    // node.start('ws://localhost:9944', registerJoystreamTypes);
  }

  create() {
    // TODO: If files exists delete them?
    const to = path.resolve(process.cwd(), 'src');
    if (!fs.pathExistsSync(to)) {
      this.error(
        'src directory does not exists. Go to root of the project dir then run this command'
      );
    }

    // Create src/index.ts file
    const indexFileContent = fs.readFileSync(
      path.resolve(__dirname, '..', 'helpers', 'templates', 'index-builder-entry.mst'),
      'utf8'
    );

    let formatted = formatWithPrettier(indexFileContent);
    createFile(path.resolve(to, 'index.ts'), formatted);

    const indexBuilderDirectoryName = 'index-builder';
    const queryNodeDirectoryName = 'query-node';

    const indexBuilderTemplate = path.resolve(
      __dirname,
      '..',
      'helpers',
      indexBuilderDirectoryName
    );
    const queryNodeTemplate = path.resolve(__dirname, '..', 'helpers', queryNodeDirectoryName);

    const indexBuilderPath = path.resolve(to, indexBuilderDirectoryName);
    const queryNodePath = path.resolve(to, queryNodeDirectoryName);

    createDir(indexBuilderPath);
    createDir(queryNodePath);

    copyFiles(indexBuilderTemplate, indexBuilderPath);
    copyFiles(queryNodeTemplate, queryNodePath);
  }
}
