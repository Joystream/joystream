const mockSuccessResponse = {
  data: [
    {
        id: 100,
        title: 'Text!',
        description: '',
    },
    {
        id: 42,
        title: 'Other Text',
        description: 'More text...',
    },
],
}

/*
 * Example of mocking a module that is "default imported" into the system under test.
 * Mocking in jest must occur before the SUT file is imported (hence the two test files). 
 */
jest.mock('../../services/todos.service', () => ({
    __esModule: true,
    default: () => {
        return Promise.resolve(mockSuccessResponse)
      },
  })
)

import todosCustomMiddleware from './todosCustomMiddleware';
import { Dispatch } from 'react';
import { TODOS_REQUESTED, TODOS_SUCCESS, TODOS_FAILED } from '../types/todos';
import { AnyAction } from 'redux';

describe('loginCustomMiddleware', () => {

  it('should handle LOGIN_REQUESTED action when logging in fails', async () => {

    const middleware = todosCustomMiddleware();

    const fakeStore = {
      dispatch: jest.fn(),
      getState: jest.fn()
    }

    const fakeNext: Dispatch<any> = (value: any): void => { }
    const fakeAction: AnyAction = { type: TODOS_REQUESTED }

    await middleware(fakeStore)(fakeNext)(fakeAction)

    expect(fakeStore.dispatch).toHaveBeenCalledTimes(1)

    const handledAction = fakeStore.dispatch.mock.calls[0][0]

    expect(handledAction.type).toEqual(TODOS_SUCCESS)
    expect(handledAction.payload).toEqual(mockSuccessResponse.data)

  })

  it('should call next for action with unkown type', async () => {

    const middleware = todosCustomMiddleware();

    const fakeStore = {
      dispatch: jest.fn(),
      getState: jest.fn()
    }

    const fakeNext: Dispatch<any> = jest.fn()
    const fakeAction: AnyAction = { type: "" }

    await middleware(fakeStore)(fakeNext)(fakeAction)

    expect(fakeStore.dispatch).toHaveBeenCalledTimes(0)
    expect(fakeNext).toHaveBeenCalledWith(fakeAction)

  })

})