import { asyncLoginFunction } from './async-login-function'

export interface ILoginParams {
    name?: string;
    password?: string;
}

export interface ILoginSuccess {
    data: {
        id: number;
    }
}

export interface ILoginError {
    error: any;
}

const loginService = async (params: ILoginParams = {}): Promise<(ILoginSuccess | ILoginError)> => {

    try {
        return await asyncLoginFunction(params)
    }
    catch (err) {
        return err
    }
   
};

export default loginService;
