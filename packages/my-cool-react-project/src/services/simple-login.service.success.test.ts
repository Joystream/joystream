const mockSuccessResponse = {
    data: {
        id: 42,
    }
}

/**
 *  Example of mocking a function that was imported into the system under test.
 *  The mock must be declared before importing the SUT file, hence the two test fies.
 */
jest.mock('./async-login-function', () => {
    return {
        asyncLoginFunction: async () => {
            return mockSuccessResponse
        }
    }

})

import loginService from './simple-login.service'

describe("loginService", () => {

    it('should return a promise containing the id data.', async () => {

        const result = await loginService()

        expect(result).toEqual(mockSuccessResponse)

    })

})