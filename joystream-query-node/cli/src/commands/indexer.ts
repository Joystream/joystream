import * as fs from 'fs-extra';
import * as path from 'path';
import { Command, flags } from '@oclif/command';

import { copyFiles, createDir, createFile, getTemplatePath } from '../utils/utils';
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
    const cwd = process.cwd();

    // TODO: If files exists delete them?
    const srcDir = path.resolve(cwd, 'src');
    if (!fs.pathExistsSync(srcDir)) {
      this.error(
        'src directory does not exists. Go to root of the project dir then run this command'
      );
    }

    // Create src/index.ts file
    const indexFileContent = formatWithPrettier(
      fs.readFileSync(getTemplatePath('index-builder-entry.mst'), 'utf8')
    );
    createFile(path.resolve(srcDir, 'index.ts'), indexFileContent);

    // Create src/processing_pack.ts
    const processingPackFileContent = formatWithPrettier(
      fs.readFileSync(getTemplatePath('processing-pack.mst'), 'utf8')
    );
    createFile(path.resolve(srcDir, 'processingPack.ts'), processingPackFileContent);

    // Create src/mappings.ts
    const mappingFileContent = formatWithPrettier(
      fs.readFileSync(getTemplatePath('mappings.mst'), 'utf8')
    );
    createFile(path.resolve(srcDir, 'mappings.ts'), mappingFileContent);

    // Create src/helper.ts
    const dbHelperTemplate = formatWithPrettier(
      fs.readFileSync(getTemplatePath('db-helper.mst'), 'utf8')
    );
    createFile(path.resolve(srcDir, 'helper.ts'), dbHelperTemplate);

    // Create .env file.
    const dotenvFileContent = fs.readFileSync(getTemplatePath('dotenv.mst'), 'utf8');
    createFile(path.resolve(cwd, '.env'), dotenvFileContent);

    // helpers/index-builder: template code for index builder
    const indexBuilderTemplate = path.resolve(__dirname, '..', 'helpers', 'index-builder');
    // helpers/query-node: template code for query node
    const queryNodeTemplate = path.resolve(__dirname, '..', 'helpers', 'query-node');

    // src/index-builder
    const indexBuilderPath = path.resolve(srcDir, 'index-builder');
    // src/query-node
    const queryNodePath = path.resolve(srcDir, 'query-node');

    // Create substrate-query-node/src/index-builder
    createDir(indexBuilderPath);
    // substrate-query-node/src/query-node
    createDir(queryNodePath);

    // Copy helpers/index-builder and helpers/query-node to src directory
    copyFiles(indexBuilderTemplate, indexBuilderPath);
    copyFiles(queryNodeTemplate, queryNodePath);

    // Copy package.json to substrate-query-node directory. substrate-query-node depends on
    // typeorm, pg, shortid etc. they need to be installed before running the node
    copyFiles(getTemplatePath('package.json'), path.resolve(cwd, 'package.json'));
  }
}
