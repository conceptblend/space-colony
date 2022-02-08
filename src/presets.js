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
    description: "Triangular with closed sections",
    lifespan: 48,
    maxDist: 32,
    minDist: 12,
    branchLength: 8,
    attractors: 25000,
    angle: 120,
    canvasSize: 600 /*540 * 2*/
  },
  box: {
    lifespan: 48,
    maxDist: 24,
    minDist: 12,
    branchLength: 8,
    attractors: 25000,
    angle: 90,
    canvasSize: 600, /*540 * 2*/
    steering: /* src: tree.js */STEERING_OPTIONS.RIGHT_ROUNDING,
  },
  processingCommunity: {
    description: "Balanced parameters to get the rich, tightly packed output we want!",
    lifespan: 96,
    maxDist: 24,
    minDist: 8,
    branchLength: 4,
    attractors: 25000,
    angle: 120,
    canvasSize: 1080, /*540 * 2*/
    steering: /* src: tree.js */STEERING_OPTIONS.LEFT_ROUNDING,
  },
  processingCommunity2: {
    description: "Balanced parameters to get the rich, tightly packed output we want! But a little wonkier.",
    lifespan: 72,
    maxDist: 24,
    minDist: 12,
    branchLength: 10,
    attractors: 25000,
    angle: 120,
    canvasSize: 1080, /*540 * 2*/
    steering: /* src: tree.js */STEERING_OPTIONS.LEFT_ROUNDING,
  },
  processingCommunity3: {
    description: "Use for hte circles at 90. Balanced parameters to get the rich, tightly packed output we want! But a little wonkier.",
    lifespan: 48,
    maxDist: 24,
    minDist: 12,
    branchLength: 4,
    attractors: 25000,
    angle: 90,
    canvasSize: 600, /*540 * 2*/
    steering: /* src: tree.js */STEERING_OPTIONS.LEFT_ROUNDING,
  },
  funfunfun: {
    description: "harumph",
    lifespan: 48,
    maxDist: 24,
    minDist: 8,
    branchLength: 4,
    attractors: 25000,
    angle: 60,
    canvasSize: 1080, /*540 * 2*/
    steering: /* src: tree.js */STEERING_OPTIONS.LEFT_ROUNDING,
  },
  flowfield: {
    description: "flow-field",
    lifespan: 64,
    maxDist: 24,
    minDist: 8,
    branchLength: 4,
    attractors: 25000,
    angle: 60,
    canvasSize: 1080, /*540 * 2*/
    steering: /* src: tree.js */STEERING_OPTIONS.NONE,
  },
  flowfield2: {
    description: "flow-field2",
    lifespan: 96,
    maxDist: 32,
    minDist: 16,
    branchLength: 3,
    attractors: 25000,
    angle: 45,
    canvasSize: 1080, /*540 * 2*/
    steering: /* src: tree.js */STEERING_OPTIONS.NONE,
  },
  flowfieldPlay: {
    description: "flow-field-play",
    lifespan: 128,
    maxDist: 24,
    minDist: 8,
    branchLength: 2,
    attractors: 25000,
    angle: 45,
    canvasSize: 1080, /*540 * 2*/
    steering: /* src: tree.js */STEERING_OPTIONS.NONE,
  },
  flowfieldPlay2: {
    description: "flow-field-play2",
    lifespan: 128,
    maxDist: 32,
    minDist: 12,
    branchLength: 3,
    attractors: 25000,
    angle: 15,
    canvasSize: 1080, /*540 * 2*/
    steering: /* src: tree.js */STEERING_OPTIONS.ROUNDING,
  },
  test2: {
    description: "test2",
    lifespan: 64,
    maxDist: 24,
    minDist: 8,
    branchLength: 4,
    attractors: 500,//25000,
    angle: 45,
    canvasSize: 540, /*540 * 2*/
    steering: /* src: tree.js */STEERING_OPTIONS.ROUNDING,
  },
  test: {
    description: "test",
    lifespan: 128,
    maxDist: 16,
    minDist: 3,
    branchLength: 2,
    attractors: 5000,//25000,
    angle: 25,
    canvasSize: 540*2, /*540 * 2*/
    steering: /* src: tree.js */STEERING_OPTIONS.LEFT_ROUNDING,
  },
  test2: {
    description: "test",
    lifespan: 128,
    maxDist: 16,
    minDist: 3,
    branchLength: 4,
    attractors: 5000,//25000,
    angle: 25,
    canvasSize: 540*2, /*540 * 2*/
    steering: /* src: tree.js */STEERING_OPTIONS.NONE,
  },
};

const CONFIG = presets.test2;