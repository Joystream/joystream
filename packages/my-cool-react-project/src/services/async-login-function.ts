import { ILoginParams, ILoginSuccess, ILoginError } from './simple-login.service'

/*
 * This function is purely meant to serve as an imported async function.
 * See the "simple-login.service.ts" tests for an example of how it can be mocked.
 */
export const asyncLoginFunction = (params: ILoginParams = {}): Promise<ILoginSuccess | ILoginError> => {

    return new Promise((resolve, reject) => {

        resolve({
            data: {
                id: Math.floor(Math.random() * 10000),
            },
        });

    });

}