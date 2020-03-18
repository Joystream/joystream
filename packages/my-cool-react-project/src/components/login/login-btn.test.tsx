import React, { Dispatch } from 'react';
import renderer from 'react-test-renderer';
import LoginBtn from './login-btn';
import { Provider } from 'react-redux';
import configureMockStore, { MockStoreEnhanced } from 'redux-mock-store';
import { LOGIN_REQUESTED, LOGOUT } from '../../state/types/login';
import { AnyAction } from 'redux';

describe('LoginBtn', () => {

    describe('Rendering label of the LoginBtn component (either Login or Logout) properly based on props', () => {

        let mockStore;
        let store: MockStoreEnhanced<unknown, {}>;
        beforeEach(() => {
            mockStore = configureMockStore();

            store = mockStore({
                loggedInReducer: {
                    fetching: false,
                    error: undefined,
                    userId: undefined,
                },
            });

        });

        it('should render as "Login" btn when explicitly passed "false" prop.', () => {

            const tree = renderer
                .create(
                    <Provider store={store}>
                        <LoginBtn currentlyLoggedIn={false} />
                    </Provider>,
                )
                .toJSON();

            expect(tree?.children).toContain('Login');
        });

        it('should render as "Logout" btn when explicitly passed "false" prop.', () => {

            const tree = renderer
                .create(
                    <Provider store={store}>
                        <LoginBtn currentlyLoggedIn={true} />
                    </Provider>,
                )
                .toJSON();

            expect(tree?.children).toContain('Logout');
        });
    });

    describe('dispatches proper action redux actions when clicked.', () => {

        let mockStore;
        let store: MockStoreEnhanced<unknown, {}>;
        let mockDispatch: Dispatch<AnyAction>;

        beforeEach(() => {
            mockStore = configureMockStore();

            store = mockStore({
                loggedInReducer: {
                    fetching: false,
                    error: undefined,
                    userId: undefined,
                },
            });

            mockDispatch = jest.fn();
            jest.mock('react-redux', () => ({
                useSelector: jest.fn(),
                useDispatch: () => mockDispatch,
            }));

        });

        it('should dispatch the logout event.', () => {

            const tree = renderer
                .create(
                    <Provider store={store}>
                        <LoginBtn currentlyLoggedIn={true} />
                    </Provider>,
                )
                .toJSON();

            expect(tree?.children).toContain('Logout');

            tree?.props.onClick();

            const actions = store.getActions();
            expect(actions).toEqual([{ type: LOGOUT }]);
        });

        it('should dispatch the login event.', () => {

            const tree = renderer
                .create(
                    <Provider store={store}>
                        <LoginBtn currentlyLoggedIn={false} />
                    </Provider>,
                )
                .toJSON();

            expect(tree?.children).toContain('Login');

            tree?.props.onClick();

            const actions = store.getActions();
            expect(actions).toEqual([{ type: LOGIN_REQUESTED }]);
        });

    });

});
