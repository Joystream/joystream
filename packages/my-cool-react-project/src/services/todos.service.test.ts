import todosService from './todos.service'

describe("todosService", () => {

    it('should return a promise containing an object with a randomly generated number userId', async () => {

        /**
         *  In general, mock any dependencies of the system udner test.
         *  See the simple-login.service.ts tests for "jest.mock" examples.
         **/ 

        const expectedResponseData = [
            {
                id: 1,
                title: 'First Thing',
                description: 'This is a very interesting description.',
            },
            {
                id: 2,
                title: 'Second Thing',
                description: 'This is a another interesting description.',
            },
        ]

        const result = await todosService()

        expect(result).toEqual({data: expectedResponseData})

    })

})