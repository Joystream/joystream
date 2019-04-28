import React, { useReducer, createContext, useContext, useEffect } from 'react';
import store from 'store';

export const MY_ADDRESS = 'joy.myAddress';

function readMyAddress (): string | undefined {
  const myAddress: string | undefined = store.get(MY_ADDRESS);
  console.log('Read my address from the local storage:', myAddress);
  return myAddress;
}

type MyAccountState = {
  inited: boolean,
  address?: string
};

type MyAccountAction = {
  type: 'reload' | 'set' | 'forget' | 'forgetExact',
  address?: string
};

function reducer (state: MyAccountState, action: MyAccountAction): MyAccountState {

  function forget () {
    console.log('Forget my address');
    store.remove(MY_ADDRESS);
    return { ...state, address: undefined };
  }

  let address: string | undefined;

  switch (action.type) {

    case 'reload':
      address = readMyAddress();
      console.log('Reload my address:', address);
      return { ...state, address, inited: true };

    case 'set':
      address = action.address;
      if (address && address !== state.address) {
        console.log('Set my new address:', address);
        store.set(MY_ADDRESS, address);
        return { ...state, address, inited: true };
      }
      return state;

    case 'forget':
      return forget();

    case 'forgetExact':
      if (readMyAddress() === address) {
        return forget();
      }
      return state;

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

type MyAccountContextProps = {
  state: MyAccountState,
  dispatch: React.Dispatch<MyAccountAction>,
  reload: () => void,
  forget: () => void,
  set: (address: string) => void
};

const contextStub: MyAccountContextProps = {
  state: initialState,
  dispatch: functionStub,
  reload: functionStub,
  forget: functionStub,
  set: functionStub
};

export const MyAccountContext = createContext<MyAccountContextProps>(contextStub);

export function MyAccountProvider (props: React.PropsWithChildren<{}>) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (!state.inited) {
      dispatch({ type: 'reload' });
    }
  }, [state.inited]);

  const contextValue = {
    state,
    dispatch,
    reload: () => dispatch({ type: 'reload' }),
    forget: () => dispatch({ type: 'forget' }),
    set: (address: string) => dispatch({ type: 'set', address })
  };
  return (
    <MyAccountContext.Provider value={contextValue}>
      {props.children}
    </MyAccountContext.Provider>
  );
}

export function useMyAccount () {
  return useContext(MyAccountContext);
}
