import { Config } from 'warthog';
import * as path from 'path';
import * as util from './utils';
import { GeneratorContext } from './SourcesGenerator';

export class ConfigProvider {
  readonly config: Config;
  readonly cliGeneratedPath: string;

  constructor() {
    this.config = new Config();
    this.config.loadSync();

    this.cliGeneratedPath = path.join(this.config.get('ROOT_FOLDER'), '/', this.config.get('CLI_GENERATE_PATH'), '/');
  }

  withGeneratedFolderRelPath(name: string): GeneratorContext {
    const destFolder = this.getDestFolder(name);
    const generatedFolderRelPath = path.relative(destFolder, this.config.get('GENERATED_FOLDER'));
    return {
      generatedFolderRelPath,
    };
  }

  getDestFolder(name: string): string {
    return util.supplant(this.cliGeneratedPath, util.names(name));
  }

  getMigrationsFolder(): string {
    return this.config.get('DB_MIGRATIONS_DIR') as string;
  }
}
