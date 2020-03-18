import React from 'react';
import LoginBtn from './login-btn';

const loginSectionStyle = {
  margin: '4vw',
  padding: '4vw',
  borderRadius: '5px',
  backgroundColor: 'rebeccapurple',
  color: 'white',
};

// Treats the number 0 as an INVALID userId
const LoginSection = ({ userId }: ILoginSectionProps) => {
  return (
    <div id='login-section' style={loginSectionStyle}>
      <h2 id='userId-section'>User Id: {userId !== 0 && userId}</h2>
      <LoginBtn currentlyLoggedIn={!!userId} />
    </div>
  );
};

interface ILoginSectionProps {
  userId: number | undefined;
}

export default LoginSection;
