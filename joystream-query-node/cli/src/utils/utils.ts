import * as fs from 'fs';

export function createDir(path: string) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
}

export function createFile(path: string, content: string) {
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, content);
  }
}
