import { loginRequested, loginFailed } from "./login"
import { LOGIN_REQUESTED, LOGIN_FAILED } from "../types/login"

describe('login actions', () => {

  it('should create a loginRequested action', () => {

    const expectedResponse = { type: LOGIN_REQUESTED }

    expect(loginRequested()).toEqual(expectedResponse)

  })

  it('should create a loginFailed action', () => {

    const someError = new Error('my err')
    const expectedResponse = {
      type: LOGIN_FAILED,
      payload: someError
    }

    expect(loginFailed(someError)).toEqual(expectedResponse)

  })

})