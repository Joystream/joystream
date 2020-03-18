const mockFailureResponse = {
  err: {
    message: "Ayy, bad things!",
  },
}

/*
 * Example of mocking a module that is "default imported" into the system under test.
 * Mocking in jest must occur before the SUT file is imported (hence the two test files). 
 */
jest.mock('../../services/todos.service', () => ({
    __esModule: true,
    default: () => {
        return Promise.reject(mockFailureResponse)
      },
  })
)

import todosCustomMiddleware from './todosCustomMiddleware';
import { Dispatch } from 'react';
import { TODOS_REQUESTED, TODOS_FAILED } from '../types/todos';
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

    expect(handledAction.type).toEqual(TODOS_FAILED)
    expect(handledAction.payload).toEqual(mockFailureResponse)

  })

})