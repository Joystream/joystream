import * as path from 'path';
import { config } from 'dotenv';

export function initConfig() {
  config({ path: path.resolve(__dirname, '../../../.env') });
}
