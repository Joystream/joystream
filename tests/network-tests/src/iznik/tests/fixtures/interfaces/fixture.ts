export interface Fixture {
  runner(expectFailure: boolean): Promise<void>
}
