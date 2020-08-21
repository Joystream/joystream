export default abstract class BaseTransport {
  protected promise<T> (value: T, timeout?: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (timeout) {
        (new Promise(resolve => setTimeout(resolve, timeout))).then(() => resolve(value));
      } else {
        resolve(value);
      }
    });
  }

  protected simulateApiResponse<T> (value: T): Promise<T> {
    return this.promise<T>(value, this.randomTimeout());
  }

  protected randomTimeout (min = 1, max = 20): number {
    return Math.random() * (max - min) + min;
  }
}
