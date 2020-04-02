export default Array.from({ length: 25 }, (_, i) => i + 1).reduce(
  (spaces: { [k: string]: string }, n: number) => {
    spaces[`s${n}`] = `${0.25 * n}rem`;
    return spaces;
  },
  {}
);
