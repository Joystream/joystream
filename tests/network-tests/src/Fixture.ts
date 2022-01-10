import { Api } from './Api'
import { assert } from 'chai'
import { ISubmittableResult } from '@polkadot/types/types/'
import { DispatchResult } from '@polkadot/types/interfaces/system'
import { QueryNodeApi } from './QueryNodeApi'
import { CliApi } from './CliApi'

export abstract class BaseFixture {
  protected readonly api: Api
  private _executed = false
  // The reason of the "Unexpected" failure of running the fixture
  private _err: Error | undefined = undefined

  constructor(api: Api) {
    this.api = api
  }

  // Derviced classes must not override this
  public async runner(): Promise<void> {
    this._executed = true
    return this.execute()
  }

  abstract execute(): Promise<void>

  // Used by execution implementation to signal failure
  protected error(err: Error): void {
    this._err = err
  }

  get executed(): boolean {
    return this._executed
  }

  public didFail(): boolean {
    if (!this.execute) {
      throw new Error('Trying to check execution result before running fixture')
    }
    return this._err !== undefined
  }

  public executionError(): Error | undefined {
    if (!this.executed) {
      throw new Error('Trying to check execution result before running fixture')
    }
    return this._err
  }

  protected expectDispatchError(result: ISubmittableResult, errMessage: string): ISubmittableResult {
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

  protected expectDispatchSuccess(result: ISubmittableResult, errMessage: string): ISubmittableResult {
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

export abstract class BaseQueryNodeFixture extends BaseFixture {
  protected readonly query: QueryNodeApi
  protected readonly cli: CliApi

  constructor(api: Api, query: QueryNodeApi, cli: CliApi) {
    super(api)
    this.query = query
    this.cli = cli
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

    await this.fixture.runner()
    // TODO: record ending block
    const err = this.fixture.executionError()
    assert.equal(err, undefined)
  }
}
