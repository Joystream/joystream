const mockFailureResponse = "Something bad happened!"

/*
 * Example of mocking a function that was imported into the system under test.
 * The mock must be declared before importing the SUT file, hence the two test fies.
 */
jest.mock('./async-login-function', () => {
    return {
        asyncLoginFunction: () => {
            return Promise.reject(mockFailureResponse)
        }
    }
})

import loginService from './simple-login.service'

describe("loginService", () => {

    it('should return a promise containing the id data.', async () => {

        const fakeParams = {}

        const result = await loginService(fakeParams)

        expect(result).toEqual(mockFailureResponse)

    })

})