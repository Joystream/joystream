import React from 'react';
import renderer from 'react-test-renderer';
import Todo from './todo';
import { ITodo } from '../../models/todo';

describe('Todo', () => {

    it('should render prop title and description.', () => {

        const fakeTodo: ITodo = {
            id: 42,
            title: 'A cool title',
            description: 'A nice description',
        };

        const renderedTodo = renderer.create(<Todo todo={fakeTodo} />)
            .toJSON();

        renderedTodo?.children?.forEach((childElement: any) => {

            if (childElement?.type === 'h1') {
                expect(childElement?.children).toEqual([fakeTodo.title]);
            }

            if (childElement?.type === 'p') {
                expect(childElement?.children).toEqual([fakeTodo.description]);
            }

        });

    });

});
