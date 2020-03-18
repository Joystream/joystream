import todosReducer from './todos';
import { TODOS_SUCCESS, TODOS_REQUESTED, TODOS_FAILED } from '../types/todos';
import { initialState as todosReducerInitialState } from './todos';

describe("todoReducer", () => {

  it('should handle a TODOS_REQUESTED action.', () => {

    const initialState = {
      fetching: false,
      error: undefined,
      todos: [],
    }

    const incomingAction = {
      type: TODOS_REQUESTED
    }

    const finalState = todosReducer(initialState, incomingAction)

    expect(finalState).toEqual({ fetching: true, error: undefined, todos: [] })
  })

  it('should handle a TODOS_SUCCESS action.', () => {

    const fakeTodoReponse = [
      {
        id: 1,
        title: 'Derp',
        description: 'derp description',
      },
      {
        id: 2,
        title: 'Derp2',
        description: 'derp2 description',
      }];

    const initialState = {
      fetching: false,
      error: undefined,
      todos: [],
    }

    const incomingAction = {
      type: TODOS_SUCCESS,
      payload: fakeTodoReponse
    }

    const finalState = todosReducer(initialState, incomingAction)

    expect(finalState).toEqual({ fetching: false, error: undefined, todos: fakeTodoReponse })
  })
  it('should handle a TODOS_FAILED action.', () => {

    const fakeTodoError = [
      {
        code: 500,
        message: 'Whoops!',
      }];

    const initialState = {
      fetching: false,
      error: undefined,
      todos: [],
    }

    const incomingAction = {
      type: TODOS_FAILED,
      payload: fakeTodoError
    }

    const finalState = todosReducer(initialState, incomingAction)

    expect(finalState).toEqual({ fetching: false, error: fakeTodoError, todos: [] })
  })

  it('should return intial state when passed no params.', () => {

    const finalState = todosReducer()

    expect(finalState).toEqual(todosReducerInitialState)

  })

})