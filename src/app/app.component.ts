import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import * as d3 from 'd3';
import * as math from 'mathjs';
import * as utils from './utils';
import { R, vf, regionColors, regionByColor, colorByRegion } from './consts';

const RADIUS = 5;

enum DIMENSION {
  X = 0,
  Y = 1,
  ALL = 2,
}

const VERTICAL_OFFSET = 200; // Padding to keep the visualization from getting cut off
const HORIZONTAL_OFFSET = 80; // Padding to keep the visualization from getting cut off

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

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
  // xl = 200; yl = 300; xr = this.B1p1 - 300; yr = this.B2p1 - 200;
  // dll = -200; dlr = 0; drr = -100; drl = 200;
  // xl = 200; yl = 200; xr = this.B1p1 - 300; yr = this.B2p1 - 300;
  // dll = 0; dlr = -100; drr = 200; drl = -200;

  // xl = 300; yl = 200; xr = this.B1p1 - 200; yr = this.B2p1 - 300;
  // dll = -100; dlr = 200; drr = -200; drl = 0;

  xl = 10; yl = 10; xr = this.B1p1 - 10; yr = this.B2p1 - 10;
  dll = 0; dlr = 0; drr = 0; drl = 0;

  P: Array<Array<Array<number>>>;
  B: Array<Array<Array<number>>>;
  U: Array<Array<Array<number>>>;
  DELTA: Array<Array<number>>;

  currentStep = 0;
  priorSteps = 0;

  controls = new FormGroup({
    interrupts: new FormGroup({
      leftSteps: new FormControl(100, [Validators.min(0)]),
      rightSteps: new FormControl(100, [Validators.min(0)]),
      topSteps: new FormControl(100, [Validators.min(0)]),
      bottomSteps: new FormControl(100, [Validators.min(0)]),
    }),
    totalSteps: new FormControl(1, [Validators.required, Validators.min(1)])
  });

  constructor() { }

  ngOnInit(): void {
    console.log(this.controls);
    this.step();
  }

  reset(): void {
    // Reset form values in addition to initializing the state
    this.xl = 1; this.yl = 1; this.xr = this.B1p1 - 1; this.yr = this.B2p1 - 1;
    this.dll = 0; this.dlr = 0; this.drr = 0; this.drl = 0;
    this.controls.setValue({
      interrupts: {
        leftSteps: 0,
        rightSteps: 0,
        topSteps: 0,
        bottomSteps: 0
      },
      totalSteps: 50
    });
    this.currentStep = 0;
    this.priorSteps = 0;
  }

  step(): void {
    this.priorSteps = this.currentStep;
    const nsteps: number = this.controls.get('totalSteps').value + this.currentStep;
    const stateLoop = () => {
      setTimeout(() => {
          this.calculateStateAndDraw();
          this.currentStep++;
          if (this.currentStep <= nsteps ) {
            stateLoop();
          }
        },
        1000 // 1 second timeout
      );
    };
    stateLoop();

  }

  updateState(a: math.matrix): void {
    if (this.eX(a) === 0 && this.eY(a) === 0){
      this.dlr = this.dlr + 1;  this.drr = this.drr + 1;
      this.dll = this.dll + 1;  this.drl = this.drl + 1;
      this.xl = this.xl + 1; this.xr = this.xr - 1;
      this.yl = this.yl + 1; this.yr = this.yr - 1;

      // Horizontal Middles
    } else if (this.eX(a) === 0 && this.eY(a) === 1 ) {
      this.yr = this.yr + 1;
      this.dlr = this.dlr - 1;  this.drr = this.drr - 1;

    } else if (this.eX(a) === 0 && this.eY(a) === -1 ) {
      this.yl = this.yl - 1;
      this.dll = this.dll - 1;  this.drl = this.drl - 1;

      // Vertical Middles
    } else if (this.eX(a) === 1 && this.eY(a) === 0 ) {
      this.xr = this.xr + 1;
      this.drl = this.drl - 1;  this.drr = this.drr - 1;

    } else if (this.eX(a) === -1 && this.eY(a) === 0 ) {
      this.xl = this.xl - 1;
      this.dll = this.dll - 1;  this.dlr = this.dlr - 1;

      // Corners
    } else if (this.eX(a) === -1 && this.eY(a) === -1 ) {
      this.dll = this.dll + 1;
    } else if (this.eX(a) === 1 && this.eY(a) === -1 ) {
      this.drl = this.drl + 1;
    } else if (this.eX(a) === -1 && this.eY(a) === 1 ) {
      this.dlr = this.dlr + 1;
    } else if (this.eX(a) === 1 && this.eY(a) === 1 ) {
      this.drr = this.drr + 1;
    }
  }

  ts(a: math.matrix, delta: number): number {
    return this.currentStep +
      this.eX(a) * this.xd(a) + this.eY(a) * this.yd(a)
      - this.eX(a) - this.eY(a)
      + math.abs(this.eX(a)) * math.abs(this.eY(a)) * delta;
  }

  yd(a: math.matrix): number {
    if (this.eY(a) === -1) {
      return this.yl;
    } else if (this.eY(a) === 1) {
      return this.yr;
    } else {
      return 0;
    }
  }

  xd(a: math.matrix): number {
    if (this.eX(a) === -1) {
      return this.xl;
    } else if (this.eX(a) === 1) {
      return this.xr;
    } else {
      return 0;
    }
  }

  conditionallyUpdateState(a: math.matrix): void {
    const leftDelay = this.controls.get('interrupts.leftSteps').value;
    const rightDelay = this.controls.get('interrupts.rightSteps').value;
    const topDelay = this.controls.get('interrupts.topSteps').value;
    const bottomDelay = this.controls.get('interrupts.bottomSteps').value;

    const isLeft = (this.currentStep -  this.priorSteps)  < leftDelay;
    const isRight = (this.currentStep -  this.priorSteps)  < rightDelay;
    const isTop = (this.currentStep -  this.priorSteps)  < topDelay;
    const isBottom = (this.currentStep -  this.priorSteps)  < bottomDelay;

    if ( this.eX(a) === -1  && isLeft) {
      console.log(`DELAY ${utils.pprinta(a)}`);
    } else if ( this.eX(a) === 1  && isRight ) {
      console.log(`DELAY ${utils.pprinta(a)}`);

    } else if ( this.eY(a) === 1  && isTop ) {
      console.log(`DELAY ${utils.pprinta(a)}`);

    } else if ( this.eY(a) === -1  && isBottom ) {
      console.log(`DELAY ${utils.pprinta(a)}`);

    } else {
      this.updateState(a);
    }
  }

  stepRegion(a: math.matrix): { [color: string]: Array<Array<number>> }{
    const drawPoints: { [color: string]: Array<Array<number>> } = {};

    const THETA = utils.angleSearch(a);

    let validUpdate = true;

    THETA.forEach(theta => {

      const [hTheta, Htheta, Vtheta] = this.invariantRegionBounds(theta, a);

      if (Htheta > 0 && Vtheta > 0) {
        const degTheta = utils.truncateError(theta * 180 / math.pi).toFixed(1);
        const color = colorByRegion[
          `!${this.eX(a)}${this.eY(a)}`
        ];
        drawPoints[`${color}-${degTheta}`] = this.arrangeBoundaryPoints(
          theta, a, [hTheta, Htheta, Vtheta]
        );
      } else {
        validUpdate = false;
      }

    }); // End THETA loop

    if (validUpdate) {
      // Conditionally update state according to formConrols interrupt settings, etc
      this.conditionallyUpdateState(a);
    }
    return drawPoints;
  }

  /**
   * TODO: remove unused params
   * @param currentStep - current step being run in the outer simulation
   * @param [lowTs, highTs] - likely deprecated
   */
  calculateStateAndDraw(): void {
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

    let drawPoints: { [color: string]: Array<Array<number>> } = {};

    // Begin Calculations for each region
    R.forEach((a, i) => {

      const pointsByLabel = this.stepRegion(a);
      // tslint:disable-next-line:forin
      for (const key in pointsByLabel) {
        drawPoints[key] = pointsByLabel[key];
      }
      // RESET: NOTE - shouldn't be necessary depending on the reference logic of variables
      // this.P = [
      //   [[this.xl, this.yl], [this.xr, this.yl]],
      //   [[this.xl, this.yr], [this.xr, this.yr]],
      // ];
      // this.DELTA = [
      //   [this.dll, this.drl],
      //   [this.dlr, this.drr],
      // ];
    }); // End R/region loop

    d3.select('svg').selectAll('*').remove();
    // Flip all points so the axis is inituitive (NOTE: svg origin is top left => We want bottom left)
    drawPoints = this.flipPointsVertically(drawPoints);

    // Draw with region guards on each color for easy off and on
    for (const [color, points] of Object.entries(drawPoints)) {
      const [col, label] = color.split('-');

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
      if (col === sides[0] || col === sides[1] || col === sides[2] || col === sides[3]) {         // Center only

        this.draw(points, col, label);

      }

    }

    this.drawAxis();
  }

  // |[number, number] {
  invariantIncrement(theta: number, [[xInc], [yInc]]: [[number], [number]], dimension: DIMENSION = DIMENSION.ALL): number {
    const directionalIncrement = math.multiply(utils.rot(theta), [[xInc], [yInc]]);

    switch (dimension) {
      // case (DIMENSION.ALL):
      //   return [
      //     utils.truncateError(this.eX(directionalIncrement)),
      //     utils.truncateError(this.eY(directionalIncrement))
      //   ];
      case (DIMENSION.X):
        return utils.truncateError(this.eX(directionalIncrement));
      case (DIMENSION.Y):
        return utils.truncateError(this.eY(directionalIncrement));
    }
  }

  /**
   * NOTE: We want to use these to draw a path line, so ordering matters
   * @param theta - tiling angle
   * @param bounds - 3 region invariant bounds
   */
  arrangeBoundaryPoints(theta: number, a: math.matrix, bounds: [number, number, number]): number[][] {
    const shift = 0; // RADIUS + 10;
    const localOrigin: [[number], [number]] = [[0], [0]];

    const [hTheta, Htheta, Vtheta] = bounds;
    const points = [
      [
        this.tX(a) + this.invariantIncrement(theta, localOrigin, DIMENSION.X) + shift,
        this.tY(a) + this.invariantIncrement(theta, localOrigin, DIMENSION.Y) + shift
      ], [
        this.tX(a) + this.invariantIncrement(theta, [[0], [Vtheta]], DIMENSION.X) + shift,
        this.tY(a) + this.invariantIncrement(theta, [[0], [Vtheta]], DIMENSION.Y) + shift
      ]
    ];

    // When to apply hTheta -- conditionally collect a box or pentagon depending on the sign of theta and the region
    const diff = Vtheta - (Htheta - hTheta);
    if ( Vtheta > diff ) {

      points.push([
        this.tX(a) + this.invariantIncrement(theta, [[hTheta], [Vtheta]], DIMENSION.X) + shift,
        this.tY(a) + this.invariantIncrement(theta, [[hTheta], [Vtheta]], DIMENSION.Y) + shift
      ]);

      points.push([
        this.tX(a) + this.invariantIncrement(theta, [[Htheta], [diff]], DIMENSION.X) + shift,
        this.tY(a) + this.invariantIncrement(theta, [[Htheta], [diff]], DIMENSION.Y) + shift
      ]);
    } else {
      points.push([
        this.tX(a) + this.invariantIncrement(theta, [[Htheta], [Vtheta]], DIMENSION.X) + shift,
        this.tY(a) + this.invariantIncrement(theta, [[Htheta], [Vtheta]], DIMENSION.Y) + shift
      ]);
    }

    points.push([
      this.tX(a) + this.invariantIncrement(theta, [[Htheta], [0]], DIMENSION.X) + shift,
      this.tY(a) + this.invariantIncrement(theta, [[Htheta], [0]], DIMENSION.Y) + shift
    ]);
    points.push([
      this.tX(a) + this.invariantIncrement(theta, localOrigin, DIMENSION.X) + shift,
      this.tY(a) + this.invariantIncrement(theta, localOrigin, DIMENSION.Y) + shift
    ]);

    return points;
  }

  /**
   * Global state required are P, B, U, DELTA
   * @param theta - angle in [0,90,180,270]
   * @param a - state vector
   * @returns [hTheta, Htheta, Vtheta]
   */
  invariantRegionBounds(theta: number, a: math.matrix): [number, number, number] {
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
    const rp = math.multiply(utils.rot(-1 * theta), [[p[DIMENSION.X]], [p[DIMENSION.Y]]]); // Extract column vector
    const rb = math.multiply(utils.rot(-1 * theta), [[b[DIMENSION.X]], [b[DIMENSION.Y]]]);
    const ru = math.multiply(utils.rot(-1 * theta), [[u[DIMENSION.X]], [u[DIMENSION.Y]]]);
    const ra = math.multiply(utils.rot(-1 * theta), a);
    const rO = math.multiply(utils.rot(-1 * theta), this.O());

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
    console.log(`theta: ${theta * 180 / math.pi}; a: ${utils.pprinta(a)}; h=${hTheta}, H=${Htheta}, V=${Vtheta};
      rp=${utils.pprinta(rp)};  rO=${utils.pprinta(rO)}`);

    return [hTheta, Htheta, Vtheta];
  }

  flipPointsVertically(pointsByKey: {[key: string]: Array<Array<number>>}): {[key: string]: Array<Array<number>>} {
    const shift = RADIUS + 10;

    const flippedPoints: {[key: string]: Array<Array<number>>} = {};
    for (const [key, points] of Object.entries(pointsByKey)) {
      const flipped = [];
      for (let i = points.length - 1; i >= 0; i--) {
        flipped.push(
          [points[i][0] + HORIZONTAL_OFFSET, this.B2p1 - points[i][1] + VERTICAL_OFFSET]  // TODO: Get rid of hardcoded variables
        );
      }
      flippedPoints[key] = flipped;
    }
    return flippedPoints;
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

  drawAxis(): void {
    // TODO: Maybe add gridlines: https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
    const margin = {top: 20, right: 20, bottom: 80, left: 80};   // clockwise as in CSS
    const scale = 1;
    const xScale = d3.scaleLinear()
      .domain([this.B1n1, this.B1p1 + HORIZONTAL_OFFSET])
      .range([this.B1n1 * scale, this.B1p1 + HORIZONTAL_OFFSET]);

    const yScale = d3.scaleLinear()
      .domain([this.B2n1, this.B2p1 + VERTICAL_OFFSET - 20])
      .range([this.B2p1 * scale + VERTICAL_OFFSET - 20, this.B2n1 * scale]); // flipped y-range to get ticks going the right way

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);
    const g = d3.select('svg').append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    g.append('g')
      .call(yAxis)
      .attr('stroke', 'black')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', 4)
      .attr('font-size', 16);

    g.append('g')                            // render the X axis in the inner plot area
      .attr('transform', 'translate(0,' + (this.B2p1 + VERTICAL_OFFSET - 20) + ')')  // axis runs along lower part of graph
      .call(xAxis)
      .attr('stroke', 'black')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', 4)
      .attr('font-size', 16);
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
      .attr('fill-opacity', 0.5)
      .on('mouseover', () => {
        this.stepRegion(regionByColor[color]);
        this.calculateStateAndDraw();
      });

    // Find min/max, and midpoint for all the points
    // Then append text at that midpoint for the label
    // if (label !== '') {
    //   const minX = math.min( points.map(p => p[0]) );
    //   const maxX = math.max( points.map(p => p[0]) );
    //   const minY = math.min( points.map(p => p[1]) );
    //   const maxY = math.max( points.map(p => p[1]) );

    //   d3.select('svg')
    //   .append('text')
    //   .attr('x', minX + (maxX - minX) / 2 )
    //   .attr('y', minY + (maxY - minY) / 2 )
    //   .text(
    //     `\u03b8 = ${label}`  // theta unicode
    //   );
    // }
  }
}
