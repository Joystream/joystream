#!/usr/bin/env node
// Copyright 2017-2020 @polkadot/dev authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

// This is the overriden version of polkadot-dev-build-ts binary
// which seems have some issues with our version of yarn

const babel = require('@babel/cli/lib/babel/dir').default;
const execSync = require('@polkadot/dev/scripts/execSync');
const cpx = require('cpx');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');

const CPX = ['css', 'gif', 'hbs', 'jpg', 'js', 'png', 'svg', 'd.ts']
  .map((ext) => `src/**/*.${ext}`)
  .concat('package.json');

console.log('$ polkadot-dev-build-ts', process.argv.slice(2).join(' '));

function buildWebpack () {
  execSync('yarn polkadot-exec-webpack --config webpack.config.js --mode production');
}

async function buildBabel (dir) {
  await babel({
    babelOptions: {
      configFile: path.join(process.cwd(), '../../babel.config.js')
    },
    cliOptions: {
      extensions: ['.ts', '.tsx'],
      filenames: ['src'],
      ignore: '**/*.d.ts',
      outDir: path.join(process.cwd(), 'build')
    }
  });

  [...CPX]
    .concat(`../../build/${dir}/src/**/*.d.ts`, `../../build/packages/${dir}/src/**/*.d.ts`)
    .forEach((src) => cpx.copySync(src, 'build'));
}

async function buildJs (dir) {
  if (!fs.existsSync(path.join(process.cwd(), '.skip-build'))) {
    const { name, version } = require(path.join(process.cwd(), './package.json'));

    if (!name.startsWith('@polkadot/')) {
      return;
    }

    console.log(`*** ${name} ${version}`);

    mkdirp.sync('build');

    if (fs.existsSync(path.join(process.cwd(), 'public'))) {
      buildWebpack(dir);
    } else {
      await buildBabel(dir);
    }

    console.log();
  }
}

async function main () {
  execSync('yarn polkadot-dev-clean-build');

  // By default the entry point is pioneer/, so here we move to pioneer/packages
  process.chdir('packages');

  // This line below is what caused problems with the original script, because it seems like the outdir
  // should be relative to "/pioneer/packages", but for some reason is relative to "/pioneer" instead.
  // This caused the build folder to end up in the root directory of the monorepo (instead of "pioneer/build")
  //
  // execSync('yarn polkadot-exec-tsc --emitDeclarationOnly --outdir ../build');
  execSync('yarn tsc --emitDeclarationOnly --outdir ./build');

  const dirs = fs
    .readdirSync('.')
    .filter((dir) => fs.statSync(dir).isDirectory() && fs.existsSync(path.join(process.cwd(), dir, 'src')));

  for (const dir of dirs) {
    process.chdir(dir);

    await buildJs(dir);

    process.chdir('..');
  }

  process.chdir('..');
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
