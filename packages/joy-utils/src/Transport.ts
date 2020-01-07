export abstract class Transport {
  protected async promise<T>(value: T, timeout:number = 1): Promise<T> {
    return new Promise<T>(async (resolve, reject) => {
      if (timeout > 0) {
        await new Promise(r => setTimeout(r, timeout));
      }
      resolve(value)
    })
  }
}


