import { Command, flags } from '@oclif/command';
import { createDir } from '../utils/utils';
import * as path from 'path';
import * as fs from 'fs-extra';
import Codegen from './codegen';
import WarthogWrapper from '../helpers/WarthogWrapper';

export default class Preview extends Command {
  static description = 'Preview GraphQL API schema';

  static flags = {
    schema: flags.string({ char: 's', description: 'Schema path', default: '../../schema.graphql' }),
  };

  async run(): Promise<void> {
    const { flags } = this.parse(Codegen);

    const generatedFolderPath = path.resolve(process.cwd(), Codegen.generatedFolderName);
    const isGeneratedFolderPathExists = fs.existsSync(generatedFolderPath);

    createDir(generatedFolderPath);

    // Change directory to generated
    process.chdir(generatedFolderPath);
    await this.generateAPIPreview(flags.schema, generatedFolderPath, isGeneratedFolderPathExists);
  }

  async generateAPIPreview(schemaPath: string, generatedFolderPath: string, isExists: boolean): Promise<void> {
    const warthogProjectPath = path.resolve(process.cwd(), 'api-preview');

    createDir(warthogProjectPath);
    process.chdir(warthogProjectPath);

    await new WarthogWrapper(this, schemaPath).run();

    fs.copyFileSync(
      path.resolve(warthogProjectPath, Codegen.generatedFolderName, 'schema.graphql'),
      path.resolve('../../apipreview.graphql')
    );
    // if 'generated' folder was already there dont delete it otherwise delete
    if (!isExists) {
      this.log('Removing unused files...');
      fs.removeSync(generatedFolderPath);
      this.log('Generated API Preview file -> apipreview.graphql');
    }
  }
}
