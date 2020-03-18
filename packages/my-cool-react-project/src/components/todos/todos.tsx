import React from 'react';
import Todo from './todo';
import { ITodo } from '../../models/todo';

const containerStyle = {
  color: 'black',
  margin: '4vw',
  padding: '1vw',
  borderRadius: '5px',
  backgroundColor: 'papayawhip',
};

const Todos = ({ todos }: { todos: ITodo[] }) => {

  return (
    <div style={containerStyle}>
      {todos &&
        todos.map((todo, i) => {
          return <Todo todo={todo} key={'key' + i} />;
        })}
    </div>
  );
};

export default Todos;
