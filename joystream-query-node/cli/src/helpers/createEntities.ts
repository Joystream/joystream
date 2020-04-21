import * as path from 'path';
const { exec } = require('child_process');

export function createEntities() {
  const host = process.env.WARTHOG_DB_HOST;
  const db = process.env.WARTHOG_DB_DATABASE;
  const user = process.env.WARTHOG_DB_USERNAME;
  const passwd = process.env.WARTHOG_DB_PASSWORD;
  const entityPath = process.env.SUBSTRATE_QUERY_NODE_PATH;

  // Will change! refers to substrate-query-node
  const outputPath = path.resolve(__dirname, `../../../../${entityPath}`);
  const command = `${process.env.TYPEORM_CLI} -h ${host} -d ${db} -e postgres -o ${outputPath} -u ${user} -p ${passwd}`;

  exec(command, function (error, stdout, stderr) {
    // command output is in stdout
    console.log(error, stdout, stderr);
  });
}
