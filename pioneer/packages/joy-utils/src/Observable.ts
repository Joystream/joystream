import { ISubscribable, IUnsubscribable, Observer } from './Subscribable';

export abstract class Observable<S extends { [key: string ]: any }, T> implements ISubscribable<S> {
  state: S
  protected transport: T
  protected observers: Observer<S>[] = []

  constructor (transport: T, initialState: S) {
    this.state = initialState;
    this.transport = transport;
  }

  public subscribe (observer: Observer<S>): IUnsubscribable<S> {
    this.observers.push(observer);
    return this;
  }

  public unsubscribe (observerToRemove: Observer<S>) {
    this.observers = this.observers.filter(observer => observerToRemove !== observer);
  }

  public dispatch () {
    this.observers.forEach(observer => observer(this.state));
  }

  public setState (updatedState: Partial<S>) {
    if (typeof this.state === 'object') {
      this.state = Object.assign(this.state, updatedState);
    } else {
      this.state = updatedState as S;
    }
    this.dispatch();
  }
}
