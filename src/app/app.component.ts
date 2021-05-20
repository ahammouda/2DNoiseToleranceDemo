import { Component, OnInit } from '@angular/core';

import * as d3 from 'd3';
import * as math from 'mathjs';
import * as utils from './utils';
import {R, vf} from './consts';

// import {flip, angleSearch} from './utils';

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
    this.U = [
      [[-1, -1], [1, -1]],
      [[-1, 1], [1, 1]],
    ];
    this.DELTA = [
      [this.dll, this.drl],
      [this.dlr, this.drr],
    ];

    console.log(math.size(this.P));

    R.forEach(a => {
      const THETA = utils.angleSearch(a);
      // console.log(a, THETA);

      THETA.forEach(theta => {
        // Rotate and flip state vectors
        const [xIndex, yIndex] = utils.rotIdXY(theta);
        const Pp = utils.flip(this.P, a);
        const Bp = utils.flip(this.B, a);
        const Up = utils.flip(this.U, a);
        const Dp = utils.flip(this.DELTA, a);
        // Grab state points
        const p = Pp[xIndex][yIndex];
        const b = Bp[xIndex][yIndex];
        const d = Dp[xIndex][yIndex];
        const u = Up[xIndex][yIndex];

        console.log('a', a, 'rot', xIndex, yIndex);
        // TODO: Before moving on, verify angle search is returning right thetas for all regions CHECK
        // TODO: Before performing the official calculations, start by logging the Pp's, then
        //       Bp's, etc - ALSO:  give xl,xr,yl,yr unique values so that you can more easily debug what's
        //       happening.  Even use regime here (but in non-symbolic way):
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
