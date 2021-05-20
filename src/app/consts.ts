import * as math from 'mathjs';

// export const R = [
//   math.matrix([-1, 1]),
//   math.matrix([1, 1]),
//   math.matrix([-1, -1]),
//   math.matrix([1, -1]),
//   math.matrix([0, 0]),
//   math.matrix([0, 1]),
//   math.matrix([1, 0]),
//   math.matrix([-1, 0]),
//   math.matrix([[0], [-1]]),
// ];
export const R = [
  math.matrix([[-1], [1]]),
  math.matrix([[1], [1]]),
  math.matrix([[-1], [-1]]),
  math.matrix([[1], [-1]]),
  math.matrix([[0], [0]]),
  math.matrix([[0], [1]]),
  math.matrix([[1], [0]]),
  math.matrix([[-1], [0]]),
  math.matrix([[0], [-1]]),
];


export const vf = math.matrix([ [1], [1] ]);

export const epsilon = 0.0001;
