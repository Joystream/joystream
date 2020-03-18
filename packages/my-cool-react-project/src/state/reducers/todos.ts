import { TODOS_SUCCESS, TODOS_REQUESTED, TODOS_FAILED } from '../types/todos';
import { ITodo } from '../../models/todo';

export interface ITodosState {
  fetching: boolean,
  error: object | undefined,
  todos: ITodo[] | undefined
}

export const initialState = {
  fetching: false,
  error: undefined,
  todos: [],
};

interface IAction {
  type?: string;
  payload?: any;
}

const reducer = (state = initialState, action: IAction = {}) => {

  const { type, payload } = action;

  switch (type) {
    case TODOS_REQUESTED:
      return {
        ...state,
        fetching: true,
        error: undefined,
      };

    case TODOS_SUCCESS:
      return {
        ...state,
        fetching: false,
        error: undefined,
        todos: payload,
      };

    case TODOS_FAILED:
      return {
        ...state,
        fetching: false,
        error: payload,
      };

    default:
      return state;
  }
};

export default reducer;
