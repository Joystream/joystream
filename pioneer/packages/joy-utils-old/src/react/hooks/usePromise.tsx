import { useState, useEffect, useCallback } from 'react';

export type UsePromiseReturnValues<T> = [T, any, boolean, () => Promise<void|null>];

export default function usePromise<T> (
  promise: () => Promise<T>,
  defaultValue: T,
  dependsOn: any[] = [],
  onUpdate?: (newValue: T) => void
): UsePromiseReturnValues<T> {
  const [state, setState] = useState<{
    value: T;
    error: any;
    isPending: boolean;
  }>({ value: defaultValue, error: null, isPending: true });

  let isSubscribed = true;
  const execute = useCallback(() => {
    setState({ value: state.value, error: null, isPending: true });
    return promise()
      .then(value => {
        if (isSubscribed) {
          setState({ value, error: null, isPending: false });
          if (onUpdate) {
            onUpdate(value);
          }
        }
      })
      .catch(error => {
        if (isSubscribed) {
          setState({ value: defaultValue, error: error, isPending: false });
          if (onUpdate) {
            onUpdate(defaultValue); // This should represent an empty value in most cases
          }
        }
      });
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
