import { asyncLoginFunction } from './async-login-function'
import { ILoginSuccess } from './simple-login.service'

describe("asyncLoginFunction", () => {

    it('should return a promise containing the id data with a random positive integer.', async () => {

        const result = await asyncLoginFunction() as ILoginSuccess

        const userId: number = result?.data?.id

        expect(userId).not.toBeNaN()
        expect(userId).toBeGreaterThanOrEqual(1)

    })

})