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
  math.matrix([[1], [1]]),    // maroon       //#800000
  math.matrix([[-1], [1]]),   // olive        // #808000
  math.matrix([[-1], [-1]]),  // lime         // #00FF00
  math.matrix([[1], [-1]]),   // burnt scienna //#E97451
  math.matrix([[0], [0]]),    // blue
  math.matrix([[0], [-1]]),   // pink
  math.matrix([[0], [1]]),    // magenta
  math.matrix([[-1], [0]]),   // turqoise
  math.matrix([[1], [0]]),    // brown
];

export const regionColors = [
  '#800000', // maroon
  '#808000', // olive
  '#00FF00', // lime
  '#E97451', // burnt scienna
  '#6495ED', // bluish
  '#FF00FF', // fusia
  '#CCCCFF', // purplish
  '#00FFFF', // aqua
  '#800080', // purple
];


export const vf = math.matrix([ [1], [1] ]);

export const epsilon = 0.0001;
