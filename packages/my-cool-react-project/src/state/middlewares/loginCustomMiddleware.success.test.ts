const mockSuccessResponse = {
  data: {
    id: 3,
  },
}

/*
 * Example of mocking a module that is "default imported" into the system under test.
 * Mocking in jest must occur before the SUT file is imported (hence the two test files). 
 */
jest.mock('../../services/simple-login.service', () => ({
    __esModule: true,
    default: () => {
        return Promise.resolve(mockSuccessResponse)
      },
  })
)

import loginCustomMiddleware from './loginCustomMiddleware';
import { Dispatch } from 'react';
import { LOGIN_REQUESTED, LOGIN_SUCCESS } from '../types/login';
import { AnyAction } from 'redux';

describe('loginCustomMiddleware', () => {

  it('should handle LOGIN_REQUESTED action in happy case', async () => {

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

    expect(handledAction.type).toEqual(LOGIN_SUCCESS)
    expect(handledAction.payload.userId).toEqual(mockSuccessResponse)

  })

  it('should call next for action with unkown type', async () => {

    const middleware = loginCustomMiddleware();

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