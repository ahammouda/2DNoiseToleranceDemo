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

/**
 *
 * @param value returned by a trig function (which only operates 0-180^o, converted to 0-360^o scale)
 * @returns value on a 0-360^o scale
 */
export function convertFullCircle(value: number, rad = false): number {
  if (rad && value < 0) {
    return 2 * math.pi + value;
  }
  if (!rad && value < 0) {
    return 360 + value;
  }
  return value;
}


export function rotIdXY(theta: number){
  // console.log(theta * 180 / Math.PI);
  // console.log(rot(theta));
  const vfp = math. multiply(rot(theta), vf);

  const rx = truncateError(math.subset(vfp, math.index(0, 0)));
  const ry = truncateError(math.subset(vfp, math.index(1, 0)));

  return [
    math.min(1 + rx, 1), // xIndex
    math.min(1 + ry, 1)  // yIndex
  ];
}

// TODO: Accept degrees or radians
export function rot(theta: number){
  // TODO: Some numerical precision this way - see if you can do better with radians, and then convert when you
  //       need to to 0,1,-1
  // return math.matrix([
  //   [truncateError(math.sin(math.unit(theta, 'deg'))), truncateError(math.cos( math.unit(theta, 'deg')))],
  //   [truncateError(math.cos(math.unit(theta, 'deg'))), -truncateError(math.sin(math.unit(theta, 'deg')))]
  // ]);
  return math.matrix([
    [math.cos(theta), -math.sin(theta)],
    [math.sin(theta), math.cos(theta)]
  ]);

}

// a: 1x2 vector
export function pprinta(a: math.matrix) {
  return `[${math.subset(a, math.index(0, 0))}, ${math.subset(a, math.index(1, 0))}]`;
}
/**
 * Replicates the following operator on M (_{a_xa_y})given a state array whose outer dimensions are a 2x2 matrix
 * (state array 2x2x2 in general, and we only want to operate on outer-most portion)
 *
 * M_{a_xa_y} \def \begin{bmatrix} 0 1\\ 1 0\\  \end{bmatrix}^{2-|a_x|} \cdot
 *                  M \cdot
 *                 \begin{bmatrix} 0 1\\ 1 0\\  \end{bmatrix}^{2-|a_y|}
 *
 * where stateArray = M
 *
 * If this math doesn't technically work, you can always split the x & y components of
 * each inner entry of the 2x2 matrix into separate arrays, and then merge them back
 * together
 */
export function flip(stateArray: Array<any>, a: math.matrix) {
  // if (!( math.equal(math.size(stateArray), [2, 2]) ) && !math.equal(math.size(stateArray), [2, 2, 2])) {
  //   throw Error('Must provide either 2x2 or 2x2x2 matrix');
  // }
  // strictly 2x2 case - can use matrix multiplication
  if (math.size(stateArray).length < 3) {
    let rowFlips = [[1, 0], [0, 1]]; // identity
    let colFlips = [[1, 0], [0, 1]]; // identity
    if ( math.abs( math.subset(a, math.index(1, 0)) ) === 1 ){ // If 2nd dim (y) is indicated, flip rows
      rowFlips = [[0, 1], [1, 0]];
    }
    if ( math.abs( math.subset(a, math.index(0, 0)) ) === 1 ){ // If 1st dim (x) is indicated, flip cols
      colFlips = [[0, 1], [1, 0]];
    }
    const flippedM = math.multiply(rowFlips, stateArray, colFlips);
    return flippedM;
  }
  // 2x2x2 - not sure how to collapse that last inner element
  const flippedMatrix = stateArray.map(x => Object.assign({}, x)); // deep copy
  // flippedMatrix = [flippedMatrix[0], flippedMatrix[1]];

  if ( math.abs( math.subset(a, math.index(1, 0)) ) === 1 ){ // If 2nd dim (y) is indicated, flip rows
    const tmpRow = [flippedMatrix[0][0], flippedMatrix[0][1]];
    flippedMatrix[0] = [flippedMatrix[1][0], flippedMatrix[1][1] ];
    flippedMatrix[1] = tmpRow;
  }
  if ( math.abs( math.subset(a, math.index(0, 0)) ) === 1 ) { // If 1st dim (x) is indicated, flip cols
    const tmpCol = [ flippedMatrix[0][1], flippedMatrix[1][1] ];

    flippedMatrix[0][1] = flippedMatrix[0][0];
    flippedMatrix[1][1] = flippedMatrix[1][0];
    flippedMatrix[0][0] = tmpCol[0];
    flippedMatrix[1][0] = tmpCol[1];
  }
  return flippedMatrix;
}

export function mathContains(array: Array<any>, candidate: any){
  let found = false;
  let index = 0;
  for (index = 0; index < array.length; index++){
    const elemCompares = math.deepEqual(array[index], candidate);
    if (elemCompares === true) {
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

/**
 * atan2 reference: https://math.stackexchange.com/questions/878785/how-to-find-an-angle-in-range0-360-between-2-vectors
 * @param a region vector \in consts.R
 * @returns THETA: Array<number> where each element in the array are the angles of rotation required for this region to
 *                 have a complete tiling
 */
export function angleSearch(a: math.matrix) {
  // const Su = [
  //   math.matrix([-1, 1]),
  //   math.matrix([1, 1]),
  //   math.matrix([-1, -1]),
  //   math.matrix([1, -1])
  // ];
  const Su = [
    math.matrix([[-1], [1]]),
    math.matrix([[1], [1]]),
    math.matrix([[-1], [-1]]),
    math.matrix([[1], [-1]])
  ];

  const Sp = [];
  Su.forEach(s => {
    const candidate = math.add(s, a);

    if (mathContains(R, candidate) > -1) {
      Sp.push(candidate);
    }
  });

  // console.log('a', a, 'Sp', Sp);

  const THETA = [];
  Sp.forEach((sp, index) => {
    const u = math.subtract(sp, a);

    const dot = math.squeeze(math.multiply(math.transpose(vf), u));
    const det = math.squeeze(math.det(math.concat(vf, u)));
    THETA.push(
      convertFullCircle(
        // truncateError(
          math.atan2(det, dot), true // * 180 / math.pi -- uncomment for error checking
        // )
      )
    );
    // console.log('a', a, 'u', u, 'theta', THETA[index]);
  });

  return THETA.sort((n1, n2) => n1 - n2 );
}
