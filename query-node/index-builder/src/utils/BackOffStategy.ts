import { numberEnv } from './env-flags';

export interface BackoffStrategy {
  /**
   * reset the backoff time to it's initial value
   */
  resetBackoffTime(): void;
  /**
   * Get current backoff time
   */
  getBackOffMs(): number;
  /**
   * Indicate that a failure has occured and the backoff time should be increased
   */
  registerFailure(): void;
}

const INITIAL_BACKOFF_TIME:number = numberEnv('DEFAULT_BACKOFF_TIME_MS') || 250;
const MAX_BACKOFF_TIME: number = numberEnv('MAX_BACKOFF_TIME_MS') || 1000 * 60 * 5; // 5 mins

export class ConstantBackOffStrategy implements BackoffStrategy {
  constructor (public readonly waitTime: number) {

  }

  public resetBackoffTime(): void {
    // NOOP
  }

  public registerFailure(): void {
    // NOOP
  }

  public getBackOffMs(): number {
    return this.waitTime;
  }

}

export class ExponentialBackOffStrategy implements BackoffStrategy {
  
  private backoffTime = INITIAL_BACKOFF_TIME;
  public maxBackOffTime = MAX_BACKOFF_TIME;

  public resetBackoffTime(): void {
    this.backoffTime = INITIAL_BACKOFF_TIME;
  }

  public registerFailure(): void {
    this.backoffTime = Math.min(this.maxBackOffTime, Math.ceil(this.backoffTime * 1.2));
  }

  public getBackOffMs(): number {
    return this.backoffTime;
  }
}