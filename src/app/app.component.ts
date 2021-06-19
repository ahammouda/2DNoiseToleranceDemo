import { Component, OnInit } from '@angular/core';

import * as d3 from 'd3';
import * as math from 'mathjs';
import * as utils from './utils';
import { R, vf, regionColors } from './consts';

const XI = 0;
const YI = 1;
const RADIUS = 5;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  title = 'demo2d';

  B1n1 = 0; B2n1 = 0;
  B1p1 = 1000; B2p1 = 1000;
  // possible invariant -dll=> -dll=xl=yl, but xl/yl by themselves don't => dll
  // xl = 15; yl = 15; xr = this.B1p1 - 15; yr = this.B2p1 - 15;
  // dll = -10; dlr = -10; drr = -10; drl = -10;

  // xl = 30; yl = 30; xr = this.B1p1 - 20; yr = this.B2p1 - 20;
  // dll = 20; dlr = -10; drr = 0; drl = -20;
  // *10
  // xl = 300; yl = 300; xr = this.B1p1 - 200; yr = this.B2p1 - 200;
  // dll = 200; dlr = -100; drr = 0; drl = -200;
  xl = 200; yl = 300; xr = this.B1p1 - 300; yr = this.B2p1 - 200;
  dll = -200; dlr = 0; drr = -100; drl = 200;

  // dll = -1; dlr = -2; drr = 1; drl = 2;
  P: Array<Array<Array<number>>>;
  B: Array<Array<Array<number>>>;
  U: Array<Array<Array<number>>>;
  DELTA: Array<Array<number>>;

  constructor() { }

  ngOnInit(): void {
    this.P = [
      [[this.xl, this.yl], [this.xr, this.yl]],
      [[this.xl, this.yr], [this.xr, this.yr]],
    ];
    this.B = [
      [[this.B1n1, this.B2n1], [this.B1p1, this.B2n1]],
      [[this.B1n1, this.B2p1], [this.B1p1, this.B2p1]]
    ];
    // NOTE: this.U is the best way to debug rotations given that each inner tuple is unique from each other
    this.U = [
      [[-1, -1], [1, -1]],
      [[-1, 1], [1, 1]], // will actually have to flip this row up a level
    ];

    this.DELTA = [
      [this.dll, this.drl],
      [this.dlr, this.drr],
    ];

    // console.log(math.size(this.P));
    const drawPoints: { [color: string]: Array<Array<number>> } = {};

    R.forEach((a, i) => {
      const THETA = utils.angleSearch(a);

      THETA.forEach(theta => {
        // Rotate and flip state vectors
        const [xIndex, yIndex] = utils.rotIdXY(-1 * theta);
        const Pp = utils.flip(this.P, a);
        const Bp = utils.flip(this.B, a);
        const Up = utils.flip(this.U, a);
        const Dp = utils.flip(this.DELTA, a);
        // Grab state points
        const p = Pp[xIndex][yIndex];
        const b = Bp[xIndex][yIndex];
        const d = Dp[xIndex][yIndex]; // Just single number rather than x,y coordinate
        const u = Up[xIndex][yIndex];

        // Rotate points
        const rp = math.multiply(utils.rot(-1 * theta), [[p[XI]], [p[YI]]]); // Extract column vector
        const rb = math.multiply(utils.rot(-1 * theta), [[b[XI]], [b[YI]]]);
        const ru = math.multiply(utils.rot(-1 * theta), [[u[XI]], [u[YI]]]);
        const ra = math.multiply(utils.rot(-1 * theta), a);
        const rO = math.multiply(utils.rot(-1 * theta), this.O());
        // NOTE at this point (6/4/2021) flips, indexing, rotations, orientation of matrices have all been
        // relatively well verified;
        // console.log(`theta: ${theta * 180 / math.pi}; a: ${utils.pprinta(a)}; Dp: `, Dp);

        // NOTE: You can always to a case by case verification to match what's on your poster
        //       (if a = axay && theta = q) => R(theta) = z
        const rSign = math.min(
          ru
        );
        const zTerm = (1 - math.abs(this.eY(ra))) * rSign ;
        const hTheta = this.eX(rp) + this.eX(ra) * this.eX(rb) - this.eX(rO) * (1 - math.abs(this.eX(ra))) +
          zTerm * d;
        const Htheta = this.eX(rp) + this.eX(ra) * this.eX(rb) - this.eX(rO) * (1 - math.abs(this.eX(ra))) +
          math.abs(this.eY(ra)) * this.eX(ru) * d;
        const Vtheta = this.eY(rp) + this.eY(ra) * this.eY(rb) - this.eY(rO) * (1 - math.abs(this.eY(ra))) +
          math.abs(this.eX(ra)) * this.eY(ru) * d;
        const shift = RADIUS + 10;
        const localOrigin = [[0], [0]];
        // console.log('P:  ', Pp);
        console.log(`theta: ${theta * 180 / math.pi}; a: ${utils.pprinta(a)}; h=${hTheta}, H=${Htheta}, V=${Vtheta};
        rp=${utils.pprinta(rp)};  rO=${utils.pprinta(rO)}`);
        const degTheta = utils.truncateError(theta * 180 / math.pi).toFixed(1);
        drawPoints[`${regionColors[i]}-${degTheta}`] = [];
        // const points = [
        //   localOrigin,
        //   [[0], [Vtheta]],
        // ];

        // Needs to be negative/positive according to relationship of incrementing and absolute dimensions
        // TODO: Maybe document this more
        const incX = utils.truncateError(this.eX(math.multiply(utils.rot(theta), vf)));
        const incY = utils.truncateError(this.eY(math.multiply(utils.rot(theta), vf)));

        // console.log(`theta: ${theta * 180 / math.pi}; a: ${utils.pprinta(a)};  u: ${u}; rIdx: ${xIndex}, ${yIndex},
        //  incX: ${incX}; incY: ${incY}`);

        // Question is - Htheta and VTheta should be variably thought of as comprising x/y depending on theta
        // NOTE: 4 values for each degree
        if (true){ // `${incX}` === `${incY}`) { // theta = 0 || theta = 180
          let [xAdder, yAdder] = this.invariantIncrement(theta, this.eX(localOrigin), this.eY(localOrigin));
          drawPoints[`${regionColors[i]}-${degTheta}`].push([
            // this.tX(a) + incX * this.eX(localOrigin) + shift, this.tY(a) + incY * this.eY(localOrigin) + shift
            this.tX(a) + xAdder + shift, this.tY(a) + yAdder + shift
          ]);
          [xAdder, yAdder] = this.invariantIncrement(theta, this.eX([[0], [Vtheta]]), this.eY([[0], [Vtheta]]) );
          drawPoints[`${regionColors[i]}-${degTheta}`].push([
            // this.tX(a) + incX * this.eX([[0], [Vtheta]]) + shift, this.tY(a) + incY * this.eY([[0], [Vtheta]]) + shift
            this.tX(a) + xAdder + shift, this.tY(a) + yAdder + shift
          ]);
          // When to apply hTheta
          const diff = Vtheta - (Htheta - hTheta);
          // console.log(`theta: ${theta * 180 / math.pi}; a: ${utils.pprinta(a)}; ${hTheta}, ${Htheta}, ${Vtheta};
          //   diff: ${diff}, d: ${d}, rSign: ${rSign}, z: ${zTerm}`);
          if ( Vtheta > diff ) {
            [xAdder, yAdder] = this.invariantIncrement(theta, this.eX([[hTheta], [Vtheta]]), this.eY([[hTheta], [Vtheta]]) );
            drawPoints[`${regionColors[i]}-${degTheta}`].push([
              // this.tX(a) + incX * this.eX([[hTheta], [Vtheta]]) + shift, this.tY(a) + incY * this.eY([[hTheta], [Vtheta]]) + shift
              this.tX(a) + xAdder + shift, this.tY(a) + yAdder + shift
            ]);
            [xAdder, yAdder] = this.invariantIncrement(theta, this.eX([[Htheta], [diff]]), this.eY([[Htheta], [diff]]) );
            drawPoints[`${regionColors[i]}-${degTheta}`].push([
              // this.tX(a) + incX * this.eX([[Htheta], [diff]]) + shift, this.tY(a) + incY * this.eY([[Htheta], [diff]]) + shift
              this.tX(a) + xAdder + shift, this.tY(a) + yAdder + shift
            ]);
          } else {
            [xAdder, yAdder] = this.invariantIncrement(theta, this.eX([[Htheta], [Vtheta]]), this.eY([[Htheta], [Vtheta]]) );
            drawPoints[`${regionColors[i]}-${degTheta}`].push([
              // this.tX(a) + incX * this.eX([[Htheta], [Vtheta]]) + shift, this.tY(a) + incY * this.eY([[Htheta], [Vtheta]]) + shift
              this.tX(a) + xAdder + shift, this.tY(a) + yAdder + shift
            ]);
          }
          [xAdder, yAdder] = this.invariantIncrement(theta, this.eX([[Htheta], [0]]), this.eY([[Htheta], [0]]) );
          drawPoints[`${regionColors[i]}-${degTheta}`].push([
            // this.tX(a) + incX * this.eX([[Htheta], [0]]) + shift, this.tY(a) + incY * this.eY([[Htheta], [0]]) + shift
            this.tX(a) + xAdder + shift, this.tY(a) + yAdder + shift
          ]);
        } else { // theta = 90 || theta = 270
          // NOTE: Even without testing, still think we will need to flip these when our problem is not symmetrical
          // tx and ty still fixed (and increment direction), but the actual increment amount flips dimensions
          drawPoints[`${regionColors[i]}-${degTheta}`].push([
            this.tX(a) + incX * this.eY(localOrigin) + shift, this.tY(a) + incY * this.eX(localOrigin) + shift
          ]);
          drawPoints[`${regionColors[i]}-${degTheta}`].push([
            this.tX(a) + incX * this.eY([[0], [Vtheta]]) + shift, this.tY(a) + incY * this.eX([[0], [Vtheta]]) + shift
          ]);
          // When to apply hTheta (not the right condition for middle regions)
          const diff = Vtheta - (Htheta - hTheta);
          console.log(`theta: ${theta * 180 / math.pi}; a: ${utils.pprinta(a)}; ${hTheta}, ${Htheta}, ${Vtheta};
            diff: ${diff}, d: ${d}, rSign: ${rSign}, z: ${zTerm}`);
          if ( Vtheta > diff ) {
            drawPoints[`${regionColors[i]}-${degTheta}`].push([
              this.tX(a) + incX * this.eY([[hTheta], [Vtheta]]) + shift, this.tY(a) + incY * this.eX([[hTheta], [Vtheta]]) + shift
            ]);
            drawPoints[`${regionColors[i]}-${degTheta}`].push([
              this.tX(a) + incX * this.eY([[Htheta], [diff]]) + shift, this.tY(a) + incY * this.eX([[Htheta], [diff]]) + shift
            ]);
          } else {
            drawPoints[`${regionColors[i]}-${degTheta}`].push([
              this.tX(a) + incX * this.eY([[Htheta], [Vtheta]]) + shift, this.tY(a) + incY * this.eX([[Htheta], [Vtheta]]) + shift
            ]);
          }
          drawPoints[`${regionColors[i]}-${degTheta}`].push([
            this.tX(a) + incX * this.eY([[Htheta], [0]]) + shift, this.tY(a) + incY * this.eX([[Htheta], [0]]) + shift
          ]);
        }

        // Final point for closing the lines
        drawPoints[`${regionColors[i]}-${degTheta}`].push([
          this.tX(a) + incX * this.eY(localOrigin) + shift, this.tY(a) + incY * this.eX(localOrigin) + shift
        ]);

      }); // End THETA loop
    }); // End R/region loop

    // NOTE: There seems to be an issue around corner elements bleading into the center a bit which is to
    // be expected due to the fact that we're not drawing precise bounds
    for (const [color, points] of Object.entries(drawPoints)) {
      const [col, label] = color.split('-');
      // if (col === '#6495ED') {

      //   points.forEach(element => {
      //     this.renderPoint(element[0], element[1], col, '');
      //   });
      // } else {
      //   points.forEach(element => {
      //     this.renderPoint(element[0], element[1], col, label);
      //   });
      // }
      const center = '#6495ED';
      if (col === center) {         // Center only
        this.draw(points, col, label);
      }
      const corners = [
        '#800000', // maroon
        '#808000', // olive
        '#00FF00', // lime
        '#E97451', // burnt scienna
      ];
      if (col === corners[0] || col  === corners[1] || col  === corners[2] ||  col === corners[3] ) {         // Center only
        this.draw(points, col, label);
      }
      const sides = [
        '#FF00FF', // fusia
        '#CCCCFF', // purplish
        '#00FFFF', // aqua
        '#800080', // purple
      ];
      if (col === sides[0] || col  === sides[1] || col  === sides[2] ||  col === sides[3] ) {         // Center only
        // if (label === '90.0') {
        this.draw(points, col, label);
        // }
      }

    }

    // // One way to think about this is to plot a polyline for each region; challenge is grouping regions from matrices

    // // TODO: These numbers are actually what the algorithm would spit out
    // const upper = 20;
    // const right = 20;

    // // TODO: This should be generalized - in case of square possible 2 of these points will be
    // //       redundant, but you should verify
    // const rll = [];
    // rll.push([this.B[0][0][0], this.B2p1 - this.B[0][0][1]]);             // origin
    // rll.push([this.B[0][0][0], this.B2p1 - upper]); // upper
    // rll.push([this.P[0][0][0], this.B2p1 - upper]); // upper inner (note might not exist?)
    // rll.push([right, this.B2p1 - upper + right - this.P[0][0][1]]); // right side bound upper
    // rll.push([right, this.B2p1 - this.B[0][0][1]]); // right side lower bound

    // rll.push([this.B[0][0][0], this.B2p1 - this.B[0][0][1]]); // To close the connection
    // // TODO: Display the polyline
    // this.draw(rll);

    // const rrl = [];
  }

  invariantIncrement(theta, xInc, yInc): [number, number] {
    // const sign = math.multiply(utils.rot(theta), [[1], [1]]); // TODO: Correct in algorithm too
    // const inc = math.multiply(utils.rot(-1 * theta), [[xInc], [yInc]]);
    const directionalIncrement = math.multiply(utils.rot(theta), [[xInc], [yInc]]); // TODO: Correct in algorithm too

    return [
      utils.truncateError(this.eX(directionalIncrement)),
      utils.truncateError(this.eY(directionalIncrement))
    ];
  }

  // Return column vector
  O() {
    return math.matrix([
      [this.xl + (this.xr - this.xl) / 2],
      [this.yl + (this.yr - this.yl) / 2]
    ]);
  }

  tX(a: math.matrix) {
    return this.B1p1 * math.max(this.eX(a), 0) + (1 - math.abs(this.eX(a))) * this.eX(this.O());
  }

  tY(a: math.matrix) {
    return this.B2p1 * math.max(this.eY(a), 0) + (1 - math.abs(this.eY(a))) * this.eY(this.O());
  }

  /**
   * Helper for element access
   * @param v vector
   * @returns First element from 2x1 vector v
   */
  eX(v: math.matrix) {
    return math.subset(v, math.index(0, 0));
  }

  /**
   * Helper for element access
   * @param v vector
   * @returns 2nd element from 2x1 vector v
   */
  eY(v: math.matrix) {
    return math.subset(v, math.index(1, 0));
  }

  renderPoint(x: number, y: number, color: string, label: string) {
    const scale = 1;
    const xScale = d3.scaleLinear()
      .domain([this.B1n1, this.B1p1])
      .range([this.B1n1 * scale, this.B1p1 * scale]);
    const yScale = d3.scaleLinear()
      .domain([this.B2n1, this.B2p1])
      .range([this.B2n1 * scale, this.B2p1 * scale]);

    d3.select('svg')
      .append('circle')
      .attr('cx', xScale(x))
      .attr('cy', yScale(y))
      .attr('fill', color)
      .attr('r', RADIUS);

    d3.select('svg')
      .append('text')
      .attr('x', xScale(x) + 2.5)
      .attr('y', yScale(y) + 2.5)
      .text(
        label
      );
  }

  draw(points: Array<Array<number>>, color: string, label: string = ''): void {
    const scale = 1;
    // TODO: A bit redundant
    const xScale = d3.scaleLinear()
      .domain([this.B1n1, this.B1p1])
      .range([this.B1n1 * scale, this.B1p1 * scale]);
    const yScale = d3.scaleLinear()
      .domain([this.B2n1, this.B2p1])
      .range([this.B2n1 * scale, this.B2p1 * scale]);

    console.log(points);
    const line = d3.line()
      .x(d => d3.scaleLinear()
        .domain([this.B1n1, this.B1p1])
        .range([this.B1n1 * scale, this.B1p1 * scale])(
          d[0]
        )
      )
      .y(d => d3.scaleLinear()
        .domain([this.B2n1, this.B2p1])
        .range([this.B2n1 * scale, this.B2p1 * scale])(
          d[1]
        )
      );
    // d3.select('div#main')
    //   .append('svg')
    d3.select('svg')
      .append('path')
      .attr('d', line(points))
      .attr('stroke', 'black')
      .attr('stroke-width', 4)
      .attr('fill', color)
      .attr('fill-opacity', 0.5);

    // Find min/max, and midpoint for all the points
    // Then append text at that midpoint for the label
    if (label !== '') {
      const minX = math.min( points.map(p => p[0]) );
      const maxX = math.max( points.map(p => p[0]) );
      const minY = math.min( points.map(p => p[1]) );
      const maxY = math.max( points.map(p => p[1]) );

      d3.select('svg')
      .append('text')
      .attr('x', minX + (maxX - minX) / 2 )
      .attr('y', minY + (maxY - minY) / 2 )
      .text(
        `\u03b8 = ${label}`
      );

    }
  }
}
