import { combineReducers } from 'redux';
import loginReducer, { ILoginState } from './login';
import todosReducer, { ITodosState } from './todos';

export default combineReducers({
  loginReducer,
  todosReducer,
});

export interface IStore {
  loginReducer: ILoginState,
  todosReducer: ITodosState
}
