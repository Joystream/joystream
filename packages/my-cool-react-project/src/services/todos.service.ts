import { ITodo } from '../models/todo';

export interface ITodosSuccess {
    data: ITodo[];
}

export interface ITodosError {
    error: any;
}

const todosService = (): Promise<ITodosSuccess | ITodosError> => {

    return new Promise((resolve, reject) => {

        resolve({
            data: [
                {
                    id: 1,
                    title: 'First Thing',
                    description: 'This is a very interesting description.',
                },
                {
                    id: 2,
                    title: 'Second Thing',
                    description: 'This is a another interesting description.',
                },
            ],
        });

    });
};


export default todosService;
