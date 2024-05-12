/**
 * Defines syncronization task abstraction.
 */
export interface SyncTask {
  /**
   * Returns human-friendly task description.
   */
  description(): string

  /**
   * Performs the task, since we don't want colossus to restart or crash due to service failure, this method shouldn't throw any errors.
   * Which means that all errors should be handled internally in this method
   */
  execute(): Promise<void>
}
