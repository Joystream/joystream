import {
  Subscribable as RxjsSubscribable,
  Unsubscribable as RxjsUnsubscribable
} from 'rxjs';

export type Observer<S> = (v: S) => void

export interface IUnsubscribable<T> {
  unsubscribe(observer: Observer<T>): void;
}

export interface ISubscribable<T> {
  subscribe(observer: Observer<T>): IUnsubscribable<T>;
}

export type Subscribable<T> = ISubscribable<T> | RxjsSubscribable<T>

export type Subscription<T> = IUnsubscribable<T> | RxjsUnsubscribable
