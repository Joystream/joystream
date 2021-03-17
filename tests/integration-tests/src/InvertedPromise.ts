function noop(): void {
  // No-Op
}

export class InvertedPromise<T> {
  public resolve: (value: T) => void = noop
  public reject: (reason?: any) => void = noop
  public readonly promise: Promise<T>

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }
}
