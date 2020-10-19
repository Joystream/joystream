import React, { useReducer, createContext, useEffect } from 'react';
import store from 'store';

export const ACCOUNT_CHANGED_EVENT_NAME = 'account-changed';
export const MY_ADDRESS_STORAGE_KEY = 'joy.myAddress';

function readMyAddress (): string | undefined {
  const myAddress = store.get(MY_ADDRESS_STORAGE_KEY) as string | undefined;

  console.log('Read my address from the local storage:', myAddress);

  return myAddress;
}

type MyAccountState = {
  inited: boolean;
  address?: string; // TODO rename to 'myAddress'
};

type MyAccountAction = {
  type: 'reload' | 'set' | 'forget' | 'forgetExact';
  address?: string;
};

function reducer (state: MyAccountState, action: MyAccountAction): MyAccountState {
  function forget () {
    console.log('Forget my address');
    store.remove(MY_ADDRESS_STORAGE_KEY);

    return { ...state, address: undefined };
  }

  let address: string | undefined;

  switch (action.type) {
    case 'reload': {
      address = readMyAddress();
      console.log('Reload my address:', address);

      return { ...state, address, inited: true };
    }

    case 'set': {
      address = action.address;

      if (address !== state.address) {
        if (address) {
          console.log('Set my new address:', address);
          store.set(MY_ADDRESS_STORAGE_KEY, address);

          return { ...state, address, inited: true };
        } else {
          return forget();
        }
      }

      return state;
    }

    case 'forget': {
      address = action.address;
      const isMyAddress = address && address === readMyAddress();

      if (!address || isMyAddress) {
        return forget();
      }

      return state;
    }

    default:
      throw new Error('No action type provided');
  }
}

function functionStub () {
  throw new Error('Function needs to be set in MyAccountProvider');
}

const initialState = {
  inited: false,
  address: undefined
};

export type MyAccountContextProps = {
  state: MyAccountState;
  dispatch: React.Dispatch<MyAccountAction>;
  set: (address: string) => void;
  forget: (address: string) => void;
};

const contextStub: MyAccountContextProps = {
  state: initialState,
  dispatch: functionStub,
  set: functionStub,
  forget: functionStub
};

export const MyAccountContext = createContext<MyAccountContextProps>(contextStub);

export function MyAccountProvider (props: React.PropsWithChildren<unknown>) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleAccountChangeEvent = (e: Event) => {
    const { detail: address } = e as CustomEvent<string>;

    dispatch({ type: 'set', address });
  };

  useEffect(() => {
    window.addEventListener(ACCOUNT_CHANGED_EVENT_NAME, handleAccountChangeEvent);

    return () => {
      window.removeEventListener(ACCOUNT_CHANGED_EVENT_NAME, handleAccountChangeEvent);
    };
  });

  useEffect(() => {
    if (!state.inited) {
      dispatch({ type: 'reload' });
    }
  }, [state.inited]); // Don't call this effect if `invited` is not changed

  const contextValue = {
    state,
    dispatch,
    set: (address: string) => dispatch({ type: 'set', address }),
    forget: (address: string) => dispatch({ type: 'forget', address })
  };

  return (
    <MyAccountContext.Provider value={contextValue}>
      {props.children}
    </MyAccountContext.Provider>
  );
}
