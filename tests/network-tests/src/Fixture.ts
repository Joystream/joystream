import { Api } from './Api'
import { assert } from 'chai'
import { ISubmittableResult } from '@polkadot/types/types/'
import { DispatchResult } from '@polkadot/types/interfaces/system'

export class BaseFixture {
  protected api: Api
  private executed = false
  // The reason of the "Unexpected" failure of running the fixture
  private err: Error | undefined = undefined

  constructor(api: Api) {
    this.api = api
  }

  public async runner(): Promise<void> {
    this.executed = true
    return this.execute()
  }

  protected async execute(): Promise<void> {
    return
  }

  // Used by execution implementation to signal failure
  protected error(err: Error): void {
    this.err = err
  }

  public didExecute(): boolean {
    return this.executed
  }

  public didFail(): boolean {
    if (!this.didExecute()) {
      throw new Error('Trying to check execution result before running fixture')
    }
    return this.err !== undefined
  }

  public executionError(): Error | undefined {
    if (!this.didExecute()) {
      throw new Error('Trying to check execution result before running fixture')
    }
    return this.err
  }

  protected async expectDispatchError(
    operation: Promise<ISubmittableResult>,
    errMessage: string
  ): Promise<ISubmittableResult> {
    const result = await operation
    const success = result.findRecord('system', 'ExtrinsicSuccess')

    if (success) {
      const sudid = result.findRecord('sudo', 'Sudid')
      if (sudid) {
        const dispatchResult = sudid.event.data[0] as DispatchResult
        if (dispatchResult.isOk) {
          this.error(new Error(errMessage))
        }
      } else {
        this.error(new Error(errMessage))
      }
    }

    return result
  }

  protected async expectDispatchSuccess(
    operation: Promise<ISubmittableResult>,
    errMessage: string
  ): Promise<ISubmittableResult> {
    const result = await operation
    const success = result.findRecord('system', 'ExtrinsicSuccess')

    if (success) {
      const sudid = result.findRecord('sudo', 'Sudid')
      if (sudid) {
        const dispatchResult = sudid.event.data[0] as DispatchResult
        if (dispatchResult.isError) {
          this.error(new Error(errMessage))
          // Log DispatchError details
        }
      }
    } else {
      this.error(new Error(errMessage))
      // Log DispatchError
    }

    return result
  }
}

// Runs a fixture and measures how long it took to run
// Ensures fixture only runs once, and asserts that it doesn't fail
export class FixtureRunner {
  private fixture: BaseFixture
  private ran = false

  constructor(fixture: BaseFixture) {
    this.fixture = fixture
  }

  public async run(): Promise<void> {
    if (this.ran) {
      throw new Error('Fixture already ran')
    }

    this.ran = true

    // TODO: record starting block

    try {
      await this.fixture.runner()
      // TODO: record ending block
      const err = this.fixture.executionError()
      assert.equal(err, undefined)
    } catch (err) {
      // This should make tracking which fixture caused the exception easier
      console.log(err)
      throw err
    }
  }
}
