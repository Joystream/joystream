import { LOGIN_FAILED, LOGIN_REQUESTED, LOGIN_SUCCESS, LOGOUT } from '../types/login';

export interface ILoginState {
  fetching: boolean,
  error: object | undefined,
  userId: number | undefined
}

export const initialState = {
  fetching: false,
  error: undefined,
  userId: undefined,
};

interface IAction {
  type?: string;
  payload?: unknown;
}

const reducer = (state: ILoginState = initialState, action: IAction = {}): ILoginState => {

  const { type, payload } = action;

  switch (type) {
    case LOGIN_REQUESTED:
      return {
        ...state,
        fetching: true,
        error: undefined,
        userId: undefined,
      };

    case LOGIN_SUCCESS:
      return {
        ...state,
        userId: payload.userId.data.id,
        fetching: false,
        error: undefined,
      };

    case LOGIN_FAILED:
      return {
        ...state,
        fetching: false,
        error: payload,
      };

    case LOGOUT:
      return {
        ...state,
        userId: undefined,
      };

    default:
      return state;
  }
};

export default reducer;
