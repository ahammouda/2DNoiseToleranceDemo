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

export const regionByColor = {
  '#800000': R[0], // maroon         1 1
  '#808000': R[1], // olive          -11
  '#00FF00': R[2], // lime           -1-1
  '#E97451': R[3], // burnt scienna  1-1
  '#6495ED': R[4], // bluish         00
  '#FF00FF': R[5], // fusia          0-1
  '#CCCCFF': R[6], // purplish       01
  '#00FFFF': R[7], // aqua           -10
  '#800080': R[8] // purple         10
};

// Prefixed region signature by ! so that linter doesn't
// complain for now -- TODO: do it right
export const colorByRegion = {
  '!11': '#800000', // maroon         1 1
  '!-11': '#808000', // olive          -11
  '!-1-1': '#00FF00', // lime           -1-1
  '!1-1': '#E97451', // burnt scienna  1-1
  '!00': '#6495ED', // bluish         00
  '!0-1': '#FF00FF', // fusia          0-1
  '!01': '#CCCCFF', // purplish       01
  '!-10': '#00FFFF', // aqua           -10
  '!10': '#800080', // purple         10

};


export const vf = math.matrix([ [1], [1] ]);

export const epsilon = 0.0001;
