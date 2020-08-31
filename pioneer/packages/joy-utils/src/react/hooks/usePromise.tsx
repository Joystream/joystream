import { useState, useEffect, useCallback } from 'react';

export type UsePromiseReturnValues<T> = [T, any, boolean, () => Promise<void|null>];

export default function usePromise<T> (promise: () => Promise<T>, defaultValue: T, dependsOn: any[] = []): UsePromiseReturnValues<T> {
  const [state, setState] = useState<{
    value: T;
    error: any;
    isPending: boolean;
  }>({ value: defaultValue, error: null, isPending: true });

  let isSubscribed = true;
  const execute = useCallback(() => {
    return promise()
      .then(value => (isSubscribed ? setState({ value, error: null, isPending: false }) : null))
      .catch(error => (isSubscribed ? setState({ value: defaultValue, error: error, isPending: false }) : null));
  }, [promise]);

  useEffect(() => {
    execute();
    return () => {
      isSubscribed = false;
    };
  }, dependsOn);

  const { value, error, isPending } = state;
  return [value, error, isPending, execute];
}
