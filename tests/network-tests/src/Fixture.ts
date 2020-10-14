import { Api } from './Api'

export interface Fixture {
  runner(expectFailure: boolean): Promise<void>
}

// Fixture that measures start and end blocks
// ensures fixture only runs once
export class BaseFixture implements Fixture {
  protected api: Api
  private ran = false

  constructor(api: Api) {
    this.api = api
    // record starting block
  }

  public async runner(expectFailure: boolean): Promise<void> {
    if (this.ran) {
      return
    }
    this.ran = true
    return this.execute(expectFailure)
    // record end blocks
  }

  protected async execute(expectFailure: boolean): Promise<void> {
    return
  }
}
