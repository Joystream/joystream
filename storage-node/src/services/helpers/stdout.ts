/**
 * Prints message to console. We don't use logger in some cases to avoid metadata printing.
 *
 * @param msg message to output
 */
export function print(msg: string): void {
  /* eslint-disable no-console */
  console.log(msg)
}
