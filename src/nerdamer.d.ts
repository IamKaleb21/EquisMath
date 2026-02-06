declare module "nerdamer/all.min.js" {
  const nerdamer: {
    solveEquations: (eqs: string[]) => { toString: () => string };
    solve: (equation: string, variable: string) => unknown;
  };
  export default nerdamer;
}
