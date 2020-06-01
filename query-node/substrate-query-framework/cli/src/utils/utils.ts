import * as fs from 'fs-extra';
import * as path from 'path';

export function createDir(path: string, del: boolean = false, recursive: boolean = false) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive });
  }
  if (del) {
    fs.removeSync(path);
    fs.mkdirSync(path);
  }
}

export function createFile(path: string, content: string = '', replace: boolean =false) {
  if (!fs.existsSync(path) || replace) {
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
