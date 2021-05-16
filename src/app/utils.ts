import * as math from 'mathjs';
import {R, vf, epsilon} from './consts';

/**
 * Designed for sine/cosine results so as to get clean multipliers and account for rounding error
 * but can be used very generally if you add another 2 params for upper/lower bounds
 * @param value term whose rounding error you want to truncate
 * @returns value unless it is near 0 or 1 within the +/- epsilon
 */
export function truncateError(value: number): number {
  if ( math.abs(value) - 0 < epsilon) {
    return 0;
  }
  if (math.abs(value) - 1 < epsilon ) {
    return math.sign(value);
  }
  return value;
}

export function origin(xl: number, xr: number, yl: number, yr: number){
  return math.matrix([
    xl + (xr - xl) / 2,
    yl + (yr - yl) / 2
  ]);
}

export function rotIdXY(theta: number){
  const vfp = math. multiply(rot(theta), vf);
  const rx = math.subset(vfp, math.index(0));
  const ry = math.subset(vfp, math.index(1));
  return [
    math.min(1 + ry, 1), // xIndex
    math.min(1 + rx, 1)  // yIndex
  ];
}

export function rot(theta: number){
  // TODO: Some numerical precision this way - see if you can do better with radians, and then convert when you
  //       need to to 0,1,-1
  return math.matrix([
    [truncateError(math.sin(math.unit(theta, 'deg'))), truncateError(math.cos( math.unit(theta, 'deg')))],
    [truncateError(math.cos(math.unit(theta, 'deg'))), -truncateError(math.sin(math.unit(theta, 'deg')))]
  ]);
  // return math.matrix([
  //   [math.sin(theta), math.cos(theta)],
  //   [math.cos(theta), -math.sin(theta)]
  // ]);

}

/**
 * In case of 2 by 2 state matrix, can transform to matrix, and perform the flip using the other method
 */
export function flip(stateArray: Array<any>, a: math.matrix) {
  // if (!( math.equal(math.size(stateArray), [2, 2]) ) && !math.equal(math.size(stateArray), [2, 2, 2])) {
  //   throw Error('Must provide either 2x2 or 2x2x2 matrix');
  // }
  // strictly 2x2 case - can use matrix multiplication
  if (math.size(stateArray).length < 3) {
    let rowFlips = [[0, 1], [1, 0]]; // identity
    let colFlips = [[0, 1], [1, 0]]; // identity
    if ( math.abs( math.subset(a, math.index(0)) ) === 1 ){
      rowFlips = [[1, 0], [0, 1]];
    }
    if ( math.abs( math.subset(a, math.index(1)) ) === 1 ){
      colFlips = [[1, 0], [0, 1]];
    }
    return math.multiply(rowFlips, stateArray, colFlips);
  }
  // 2x2x2 - not sure how to collapse that last inner element
  const flippedMatrix = stateArray.map(x => Object.assign({}, x)); // deep copy
  // flippedMatrix = [flippedMatrix[0], flippedMatrix[1]];

  if ( math.abs( math.subset(a, math.index(0)) ) === 1 ){
    const tmpRow = [flippedMatrix[0][0], flippedMatrix[0][1]];
    flippedMatrix[0] = [flippedMatrix[1][0], flippedMatrix[1][1] ];
    flippedMatrix[1] = tmpRow;
  }
  if ( math.abs( math.subset(a, math.index(1)) ) === 1 ){
    const tmpCol = [ flippedMatrix[0][1], flippedMatrix[1][1] ];

    flippedMatrix[0][1] = flippedMatrix[0][0];
    flippedMatrix[1][1] = flippedMatrix[1][0];
    flippedMatrix[0][0] = tmpCol[0];
    flippedMatrix[0][1] = tmpCol[1];
  }
  return flippedMatrix;
}

export function mathContains(array: Array<any>, candidate: any){
  let found = false;
  let index = 0;
  for (index = 0; index < array.length; index++){
    if (math.equal(array[index], candidate)) {
      found = true;
      break;
    }
  }
  if (found) {
    return index;
  } else {
    return -1;
  }
}

export function angleSearch(a: math.matrix) {
  const Su = [
    math.matrix([-1, 1]),
    math.matrix([1, 1]),
    math.matrix([-1, -1]),
    math.matrix([1, -1])
  ];

  const Sp = [];
  Su.forEach(s => {
    const candidate = math.add(s, a);

    if (mathContains(R, candidate) > -1) {
      Sp.push(candidate);
    }
  });

  console.log('Sp', Sp);

  const THETA = [];
  Sp.forEach(sp => {
    const u = math.subtract(sp, a);

    THETA.push(
      math.acos(
        math.multiply(u, vf) / ( math.distance([0, 0], u) * math.distance([0, 0], vf) )
      ) * 180 / math.pi
    ) ;
  });
  return THETA;
}
