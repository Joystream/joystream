#!/usr/bin/env node

const chalk = require('chalk')
const { main } = require('../dist/cli')

main()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(chalk.red(err.stack))
    process.exit(-1)
  })
