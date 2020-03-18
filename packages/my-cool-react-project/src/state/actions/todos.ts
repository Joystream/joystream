import { TODOS_FAILED, TODOS_REQUESTED, TODOS_SUCCESS } from '../types/todos';
import { ITodo } from '../../models/todo';

export const todosRequested = () => ({
  type: TODOS_REQUESTED,
});

export const todosSuccess = (todosData: { data: ITodo[] }) => {
  return {
    type: TODOS_SUCCESS,
    payload: todosData.data,
  };
};

export const todosFailed = (error: Error) => ({
  type: TODOS_FAILED,
  payload: error,
});
