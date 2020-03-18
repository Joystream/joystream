import React from 'react';
import { useDispatch } from 'react-redux';
import { loginRequested, logout } from '../../state/actions/login';

const BtnStyle = {
    margin: '1vw',
    padding: '1vw',
    borderRadius: '5px',
    backgroundColor: 'white',
    color: 'rebeccapurple',
    outline: '0',
    cursor: 'pointer',
    border: '1px solid #a9a9a9 ',
    boxShadow: '0px 5px 10px rgba(0, 0, 0, 0.3)',
};

const LoginBtnStyle = {
    backgroundColor: 'white',
    color: 'rebeccapurple',
};

const LogoutBtnStyle = {
    backgroundColor: '#DCDCDC',
    color: 'rebeccapurple',
};

const LoginBtn = ({ currentlyLoggedIn }:
    { currentlyLoggedIn: boolean }) => {

    const dispatch = useDispatch();

    const loginClicked = async () => {
        dispatch(loginRequested());
    };

    const logoutClicked = () => {
        dispatch(logout());
    };

    return (
        <button style={{
            ...BtnStyle,
            ...(currentlyLoggedIn ? LogoutBtnStyle : LoginBtnStyle),
        }}
            onClick={event => { currentlyLoggedIn ? logoutClicked() : loginClicked(); }}
        >
            {currentlyLoggedIn ? 'Logout' : 'Login'}
        </button>
    );

};

export default LoginBtn;
