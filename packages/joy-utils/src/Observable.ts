export type Observer<S> = (v: S) => void

export abstract class Observable<S, T> {
  public state: S
  protected transport: T
  protected observers: Observer<S>[] = []

  constructor(transport: T, initialState: S) {
    this.state = initialState
    this.transport = transport
  }

  public attach(observer: Observer<S>) {
    this.observers.push(observer)
  }

  public detach(observerToRemove: Observer<S>) {
    this.observers = this.observers.filter(observer => observerToRemove !== observer)
  }

  public dispatch() {
    this.observers.forEach(observer => observer(this.state))
  }
}


