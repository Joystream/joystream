/**
 * Defines syncronization task abstraction.
 */
export interface SyncTask {
  /**
   * Returns human-friendly task description.
   */
  description(): string

  /**
   * Performs the task.
   */
  execute(): Promise<void>
}
