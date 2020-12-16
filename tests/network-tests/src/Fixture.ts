import { Api } from './Api'

export interface Fixture {
  run(): Promise<void>
  executionError(): Error | undefined
}

export class BaseFixture implements Fixture {
  protected api: Api
  private failed = false
  private executed = false
  // The reason of the "Unexpected" failure of running the fixture
  private err: Error | undefined

  constructor(api: Api) {
    this.api = api
  }

  public async run(): Promise<void> {
    this.executed = true
    await this.execute()
  }

  protected async execute(): Promise<void> {
    return
  }

  // Used by execution implementation to signal failure
  protected error(err: Error): void {
    this.failed = true
    this.err = err
  }

  public didExecute(): boolean {
    return this.executed
  }

  public didFail(): boolean {
    return this.failed
  }

  public executionError(): Error | undefined {
    if (!this.didExecute()) {
      throw new Error('Trying to check execution result before running fixture')
    }
    return this.err
  }
}

// Runs a fixture and measures how long it took to run
// Ensures fixture only runs once
export class FixtureRunner {
  private fixture: Fixture
  private ran = false

  constructor(fixture: Fixture) {
    this.fixture = fixture
  }

  public async run(): Promise<Error | undefined> {
    if (this.ran) {
      throw new Error('Fixture already ran')
    }

    this.ran = true
    // record starting block
    await this.fixture.run()
    // record ending block

    return this.fixture.executionError()
  }
}
