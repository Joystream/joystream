/* eslint-disable no-console */

import * as util from 'util';

import { getBindingError } from 'warthog';

export class Logger {
  static info(...args: any[]) {
    args = args.length === 1 ? args[0] : args;
    console.log(util.inspect(args, { showHidden: false, depth: null }));
  }

  static error(...args: any[]) {
    args = args.length === 1 ? args[0] : args;
    console.error(util.inspect(args, { showHidden: false, depth: null }));
  }

  // static debug(...args: any[]) {
  //   console.debug(args);
  // }

  static log(...args: any[]) {
    console.log(args);
  }

  static warn(...args: any[]) {
    console.warn(args);
  }

  // This takes a raw GraphQL error and pulls out the relevant info
  static logGraphQLError(error: Error) {
    console.error(util.inspect(getBindingError(error), { showHidden: false, depth: null }));
  }
}
/* eslint-enable no-console */
