import * as fs from 'fs-extra';
import * as path from 'path';

export function createDir(path: string, del: boolean = false) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
  if (del) {
    fs.removeSync(path);
    fs.mkdirSync(path);
  }
}

export function createFile(path: string, content: string = '') {
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, content);
  }
}

export async function copyFiles(from: string, to: string) {
  try {
    await fs.copy(from, to);
  } catch (err) {
    console.error(err);
  }
}

export function getTemplatePath(template: string): string {
  const templatePath = path.resolve(__dirname, '..', 'templates', template);
  if (!fs.existsSync(templatePath)) {
    console.error(`Tempate ${template} does not exists!`);
    process.exit(1);
  }
  return templatePath;
}

export function getTypeormModelGeneratorConnectionConfig() {
  // Get ormconfig.json file path
  const configFilePath = path.resolve(process.cwd(), 'ormconfig.json');

  // Read content of ormconfig.json file
  const configData = fs.readFileSync(configFilePath, 'utf8');

  if (configData.length <= 1) {
    console.error('Empty config file');
    process.exit(1);
  }

  let configs;
  try {
    configs = JSON.parse(configData);
  } catch (error) {
    console.error('Invalid JSON data');
    process.exit(1);
  }

  // Find config by name
  const config = configs.find((c: any) => c.name === 'default');

  const command = [
    './node_modules/.bin/typeorm-model-generator ',
    `-h ${config.host}`,
    `-d ${config.database}`,
    `-e ${config.type}`,
    `-o entities`,
    `-u ${config.username}`,
    `-p ${config.password}`,
    '--noConfig'
  ].join(' ');
  return command;
}
