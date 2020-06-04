export abstract class Transport {
  protected promise<T> (value: T, timeout?: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (timeout) {
        (new Promise(resolve => setTimeout(resolve, timeout))).then(() => resolve(value));
      } else {
        resolve(value);
      }
    });
  }
}
