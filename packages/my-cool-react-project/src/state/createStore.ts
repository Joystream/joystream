import { composeWithDevTools } from 'redux-devtools-extension';
import combinedReducers from './reducers/root-reducer';
import { load, save } from 'redux-localstorage-simple';
import { createStore, applyMiddleware } from 'redux';
import todosCustomMiddleware from './middlewares/todosCustomMiddleware';
import loginCustomMiddleware from './middlewares/loginCustomMiddleware';
import { ILoginState } from './reducers/login';
import { ITodosState } from './reducers/todos';

export interface IState {
  loginReducer: ILoginState,
  todosReducer: ITodosState
}

export default (preloadedState: IState) => {
  return createStore(
    combinedReducers,
    getLoadedState(preloadedState),
    composeWithDevTools(
      applyMiddleware(
        save({ states: ['loginReducer'] }),
        todosCustomMiddleware(),
        loginCustomMiddleware()
      )
    ),

  );
};

const getLoadedState = (preloadedState: IState | any) => {
  if (typeof window !== 'undefined')
    return {
      ...preloadedState,
      ...load({ states: ['loginReducer'], disableWarnings: true }),
    }

  return {
    ...preloadedState,
  }
}