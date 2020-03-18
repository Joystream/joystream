import { LOGIN_FAILED, LOGIN_REQUESTED, LOGIN_SUCCESS, LOGOUT } from '../types/login';
import { ILoginSuccess, ILoginError } from '../../services/simple-login.service';

export const loginRequested = () => ({
  type: LOGIN_REQUESTED,
});

export const loginSuccess = (userId: ILoginSuccess | ILoginError) => ({
  type: LOGIN_SUCCESS,
  payload: { userId },
});

export const loginFailed = (error: Error) => ({
  type: LOGIN_FAILED,
  payload: error,
});

export const logout = () => ({
  type: LOGOUT,
});
