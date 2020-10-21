import { useState, useEffect, useRef } from 'react';
import { normalizeError } from '@joystream/js/functions/misc';
import { randomBytes } from 'crypto';

export type UsePromiseReturnValues<T> = [T, string | null, boolean, () => void];

export default function usePromise<T> (
  promise: () => Promise<T>,
  defaultValue: T,
  dependsOn: any[] = [],
  onUpdate?: (newValue: T) => void
): UsePromiseReturnValues<T> {
  const [state, setState] = useState<{
    value: T;
    error: string | null;
    isPending: boolean;
  }>({ value: defaultValue, error: null, isPending: true });

  const subscribedPromiseToken = useRef<string | null>(null);

  const executeAndSubscribePromise = () => {
    setState((state) => ({ ...state, error: null, isPending: true }));

    const thisPromiseToken = randomBytes(32).toString('hex');

    subscribedPromiseToken.current = thisPromiseToken;

    promise()
      .then((value) => {
        if (subscribedPromiseToken.current === thisPromiseToken) {
          setState({ value, error: null, isPending: false });

          if (onUpdate) {
            onUpdate(value);
          }
        } else {
          console.warn('usePromise: Token didn\'t match on .then()');
          console.warn(`Subscribed promise: ${subscribedPromiseToken.current || 'NONE'}. Resolved promise: ${thisPromiseToken}.`);
        }
      })
      .catch((error) => {
        if (subscribedPromiseToken.current === thisPromiseToken) {
          setState({ value: defaultValue, error: normalizeError(error), isPending: false });

          if (onUpdate) {
            onUpdate(defaultValue); // This should represent an empty value in most cases
          }
        } else {
          console.warn('usePromise: Token didn\'t match on .catch()');
          console.warn(`Subscribed promise: ${subscribedPromiseToken.current || 'NONE'}. Rejected promise: ${thisPromiseToken}.`);
        }
      });
  };

  useEffect(() => {
    executeAndSubscribePromise();

    return () => {
      subscribedPromiseToken.current = null;
    };
    // Silence "React Hook useEffect was passed a dependency list that is not an array literal",
    // since we want to preserve the ability to pass custom "depnendencies".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependsOn);

  const { value, error, isPending } = state;

  return [value, error, isPending, executeAndSubscribePromise];
}
