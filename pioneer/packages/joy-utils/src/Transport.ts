export abstract class Transport {
  protected async promise<T>(value: T, timeout?: number): Promise<T> {
    return new Promise<T>(async (resolve, reject) => {
      if (timeout) {
        await new Promise(r => setTimeout(r, timeout));
      }
      resolve(value)
    })
  }
}

