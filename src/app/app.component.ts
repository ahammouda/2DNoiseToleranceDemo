import { Component, OnInit } from '@angular/core';

import * as d3 from 'd3';
import * as math from 'mathjs';
import * as utils from './utils';
import {R, vf} from './consts';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  title = 'demo2d';

  B1n1 = 0;   B2n1 = 0;
  B1p1 = 100; B2p1 = 100;
  // possible invariant -dll=> -dll=xl=yl, but xl/yl by themselves don't => dll
  xl = 10;  yl = 10;  xr = this.B1p1 - 10; yr = this.B2p1 - 10;
  dll = -10; dlr = 10; drr = 10; drl = 10;

  // dll = -1; dlr = -2; drr = 1; drl = 2;
  P: Array<Array<Array<number>>>;
  B: Array<Array<Array<number>>>;
  U: Array<Array<Array<number>>>;
  DELTA: Array<Array<number>>;

  constructor(){}

  ngOnInit(): void {
    this.P = [
      [[this.xl, this.xl], [this.xr, this.yl]],
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

    R.forEach(a => {
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
        const d = Dp[xIndex][yIndex];
        const u = Up[xIndex][yIndex];

        // NOTE at this point (6/4/2021) flips, indexing, rotations, orientation of matrices have all been
        // relatively well verified;
        // TODO: Good verification scheme for the rest of the boundaries
        //       Maybe start by displaying different boundary regions separately
        // console.log(`theta: ${theta * 180 / math.pi}; a: ${utils.pprinta(a)}; Dp: `, Dp);
        console.log(`theta: ${theta * 180 / math.pi}; a: ${utils.pprinta(a)};  u: ${u}; rot: ${xIndex}, ${yIndex}`);
        // https://docs.google.com/spreadsheets/d/17FR3-6PX0GQnjRPeCvUM2gBa9fkrauOUz9QKmIgrnJg/edit#gid=0
        // const hTheta = math.multiply(utils.rot(-1 * theta), math.transpose(p));
        // console.log(p, b, d, u);
        // console.log(hTheta);
      });
    });

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

  O(){
    return math.matrix([
      this.xl + (this.xr - this.xl) / 2,
      this.yl + (this.yr - this.yl) / 2
    ]);
  }

  tX(a: math.matrix) {
    return this.B1p1 * math.max( this.eX(a) , 0) - math.abs(this.eX(a)) * this.eX( this.O() );
  }

  tY(a: math.matrix) {
    return this.B2p1 * math.max( this.eY(a) , 0) - math.abs(this.eY(a)) * this.eY( this.O() );

  }

  /**
   * Helper for element access
   * @param v vector
   * @returns First element from 2x1 vector v
   */
  eX(v: math.matrix){
    return math.subset(v, math.index(0, 0));
  }

  /**
   * Helper for element access
   * @param v vector
   * @returns 2nd element from 2x1 vector v
   */
  eY(v: math.matrix){
    return math.subset(v, math.index(1, 0));
  }

  draw(points: Array<Array<number>>): void {
    const scale = 5;
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
      .attr('fill', 'white');

  }
}
