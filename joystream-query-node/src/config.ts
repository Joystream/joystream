import * as dotenv from 'dotenv';
import * as path from 'path';

export function loadConfig() {
  delete process.env.NODE_ENV;
  dotenv.config({ path: path.join(__dirname, '../.env') });
}
