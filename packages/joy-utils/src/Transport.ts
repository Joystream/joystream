export abstract class Transport {
  protected promise<T>(value: T): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      resolve(value)
    })
  }
}


