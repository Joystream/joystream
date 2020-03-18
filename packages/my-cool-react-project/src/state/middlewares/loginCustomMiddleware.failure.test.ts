const mockFailureResponse = {
  err: {
    message: "Ayy, bad things!",
  },
}

/*
 * Example of mocking a module that is "default imported" into the system under test.
 * Mocking in jest must occur before the SUT file is imported (hence the two test files). 
 */
jest.mock('../../services/simple-login.service', () => ({
    __esModule: true,
    default: () => {
        return Promise.reject(mockFailureResponse)
      },
  })
)

import loginCustomMiddleware from './loginCustomMiddleware';
import { Dispatch } from 'react';
import { LOGIN_REQUESTED, LOGIN_FAILED } from '../types/login';
import { AnyAction } from 'redux';

describe('loginCustomMiddleware', () => {

  it('should handle LOGIN_REQUESTED action when logging in fails', async () => {

    const middleware = loginCustomMiddleware();

    const fakeStore = {
      dispatch: jest.fn(),
      getState: jest.fn()
    }

    const fakeNext: Dispatch<any> = (value: any): void => { }
    const fakeAction: AnyAction = { type: LOGIN_REQUESTED }

    await middleware(fakeStore)(fakeNext)(fakeAction)

    expect(fakeStore.dispatch).toHaveBeenCalledTimes(1)

    const handledAction = fakeStore.dispatch.mock.calls[0][0]

    expect(handledAction.type).toEqual(LOGIN_FAILED)
    expect(handledAction.payload).toEqual(mockFailureResponse)

  })

})