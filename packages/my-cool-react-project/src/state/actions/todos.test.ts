import { todosRequested, todosFailed, todosSuccess } from "./todos"
import { TODOS_REQUESTED, TODOS_FAILED, TODOS_SUCCESS } from "../types/todos"
import { ITodo } from "../../models/todo"

describe('todos actions', () => {

    it('should create a TODOS_REQUESTED action', () => {

        const expectedResponse = { type: TODOS_REQUESTED }

        expect(todosRequested()).toEqual(expectedResponse)

    })

    it('should create a todosSuccess action', () => {

        const fakeTodos: ITodo[] = [
            {
                id: 1,
                title: "Title",
                description: "description"
            }
        ]

        const fakeTodoPayload = { data : fakeTodos }

        const expectedResponse = {
            type: TODOS_SUCCESS,
            payload: fakeTodos
        }

        expect(todosSuccess(fakeTodoPayload)).toEqual(expectedResponse)

    })

    it('should create a todosFailed action', () => {

        const someError = new Error('my err')

        const expectedResponse = {
            type: TODOS_FAILED,
            payload: someError
        }

        expect(todosFailed(someError)).toEqual(expectedResponse)

    })

})