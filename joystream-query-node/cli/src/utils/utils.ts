import * as fs from 'fs-extra';

export function createDir(path: string, del: boolean = false) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
  if (del) {
    fs.removeSync(path);
    fs.mkdirSync(path);
  }
}

export function createFile(path: string, content: string) {
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, content);
  }
}
