import { DistinctQuestion } from 'inquirer'

export const BOOL_PROMPT_OPTIONS: DistinctQuestion = {
  type: 'list',
  choices: [
    { name: 'Yes', value: true },
    { name: 'No', value: false },
  ],
}
