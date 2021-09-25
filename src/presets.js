// const LIFESPAN = CONFIG.lifespan; // 48, 96, 200
// const /*tree.*/MAXDIST = CONFIG.maxDist; // 48, 24
// Open when min is greater than BRANCH_LENGTH, closed when smaller
// const /*tree.*/MINDIST = CONFIG.minDist; // 8 
// const BRANCH_LENGTH = CONFIG.branchLength;
// const /*tree.*/N = CONFIG.angle; // angle in DEGREES: 90 and 120 make good geometry
  // ^^^ Also tried weird values like 75 deg and 15 deg
// const CANVASSIZE = CONFIG.canvasSize;
// const ATTRACTORCOUNT = CONFIG.attractors; // 25000

const presets = {
  zero: {
    lifespan: 48,
    maxDist: 96,
    minDist: 24,
    branchLength: 12,
    attractors: 25000,
    angle: 120,
    canvasSize: 540 * 2
  },
  two: {
    lifespan: 24,
    maxDist: 24,
    minDist: 12,
    branchLength: 8,
    attractors: 25000,
    angle: 90,
    canvasSize: 540 * 2
  },
  shrug: {
    lifespan: 48,
    maxDist: 32,
    minDist: 24,
    branchLength: 8,
    attractors: 25000,
    angle: 120,
    canvasSize: 600 /*540 * 2*/
  },
};

const CONFIG = presets.shrug;