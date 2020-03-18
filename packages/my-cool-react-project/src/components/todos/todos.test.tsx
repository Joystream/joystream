import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import { ITodo } from '../../models/todo';
import Todos from './todos';
import Todo from './todo';

describe('Todos', () => {

    it('should renders todos data prop as a list of <Todo/> elements.', () => {

        const fakeTodos: ITodo[] = [
            {
                id: 100,
                title: 'Text!',
                description: '',

            },
            {
                id: 42,
                title: 'Other Text',
                description: 'More text...',
            },
        ];

        const shallowRenderer = ShallowRenderer.createRenderer();
        shallowRenderer.render(<Todos todos={fakeTodos} />);
        const shallowResult = shallowRenderer.getRenderOutput();

        expect(JSON.stringify(shallowResult.props.children)).toEqual(
            JSON.stringify(
                [<Todo todo={fakeTodos[0]} key={'key0'} />,
                <Todo todo={fakeTodos[1]} key={'key1'} />],
            ),
        );

    });

});
