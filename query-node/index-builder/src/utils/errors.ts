/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

/**
 * An utility method to extract info from caught objects in try {} catch (e)
 * 
 * @param e any error variable
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function logError(e: any): string {
  let details = '';
  if (e instanceof Error) {
    details = `name: ${e.name}, message: ${e.message}, stack: ${e.stack || ''}`
  }
  return `${JSON.stringify(e, null, 2)} ${details}`;
}