export abstract class Transport {
  protected async promise<T>(value: T, timeout?: number): Promise<T> {
    // ...
    if (timeout) { // means: timeout !== undefined && timeout > 0
    return new Promise<T>(async (resolve, reject) => {
      if (timeout > 0) {
        await new Promise(r => setTimeout(r, timeout));
      }
      resolve(value)
    })
  }
}

