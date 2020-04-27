import * as Prettier from 'prettier';

const prettierOptions: Prettier.Options = {
  parser: 'typescript',
  endOfLine: 'auto',
};

export function formatWithPrettier(text: string, options: Prettier.Options = prettierOptions) {
  let formatted = '';
  try {
    formatted = Prettier.format(text, options);
  } catch (error) {
    console.error('There were some errors while formatting with Prettier', error);
    formatted = text;
  }
  return formatted;
}
