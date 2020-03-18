import React from 'react';
import { Link } from 'gatsby';
import { connect } from 'react-redux';
import Layout from '../components/layout';
import Image from '../components/image';
import SEO from '../components/seo';
import Todos from '../components/todos/todos';
import LoginSection from '../components/login/login-section';
import { IState } from '../state/createStore';
import { ITodo } from '../models/todo';

const imgStyle = { maxWidth: '300px', marginBottom: '1.45rem' };

const pStyle = {
  fontSize: 'calc(5px + 3vw)',
  lineHeight: 'calc(12px + 3vw)',
  margin: '2px',
};

const IndexPage = ({ todos = [], userId = 0}: { todos: ITodo[] | undefined, userId: number | undefined }) => {

  return (
    <Layout>
      <SEO title='Home' />
      <div style={imgStyle}>
        <Image />
      </div>

      <div style={pStyle}>
        <p>Welcome to your new Gatsby site...</p>
        <p>Now go build something great!</p>
      </div>

      <LoginSection userId={userId} />

      <Todos todos={todos} />

      <Link to='/page-2/'>Go to page 2</Link>

    </Layout>
  );
};

const mapStateToProps = (state: IState) => {
  return {
    todos: state.todosReducer.todos,
    userId: state.loginReducer.userId,
  };
};

export default connect(mapStateToProps)(IndexPage);
