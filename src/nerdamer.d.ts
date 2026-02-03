declare module "nerdamer/all.min.js" {
  const nerdamer: {
    solveEquations: (eqs: string[]) => { toString: () => string };
  };
  export default nerdamer;
}
