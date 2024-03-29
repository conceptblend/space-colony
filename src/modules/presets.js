import Tree from './tree.js';

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
    steering: /* src: tree.js */Tree.steeringOptions.RIGHT_ROUNDING,
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
    steering: /* src: tree.js */Tree.steeringOptions.LEFT_ROUNDING,
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
    steering: /* src: tree.js */Tree.steeringOptions.LEFT_ROUNDING,
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
    steering: /* src: tree.js */Tree.steeringOptions.LEFT_ROUNDING,
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
    steering: /* src: tree.js */Tree.steeringOptions.LEFT_ROUNDING,
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
    steering: /* src: tree.js */Tree.steeringOptions.NONE,
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
    steering: /* src: tree.js */Tree.steeringOptions.NONE,
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
    steering: /* src: tree.js */Tree.steeringOptions.NONE,
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
    steering: /* src: tree.js */Tree.steeringOptions.ROUNDING,
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
    steering: /* src: tree.js */Tree.steeringOptions.ROUNDING,
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
    steering: /* src: tree.js */Tree.steeringOptions.LEFT_ROUNDING,
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
    steering: /* src: tree.js */Tree.steeringOptions.NONE,
    distortion: /* src: tree.js */Tree.distortionOptions.FLOW,
  },
  bw: {
    description: "test",
    lifespan: 128,
    maxDist: 16,
    minDist: 3,
    branchLength: 6,
    attractors: 5000,//25000,
    angle: 60,
    canvasSize: 540*2, /*540 * 2*/
    steering: /* src: tree.js */Tree.steeringOptions.LEFT_ROUNDING,
    distortion: /* src: tree.js */Tree.distortionOptions.FLOW,
    // colorWay: [
    //   // "#FFFFFF",
    //   "#202d95"
    // ],
  },
  bw2: {
    description: "test",
    lifespan: 64,
    maxDist: 16,
    minDist: 3,
    branchLength: 3,
    attractors: 5000,//25000,
    angle: 7,
    canvasSize: 540*2, /*540 * 2*/
    steering: /* src: tree.js */Tree.steeringOptions.NONE,
    distortion: /* src: tree.js */Tree.distortionOptions.NONE,
    colorWay: [
      "#FFFFFF",
      // "#202d95"
    ],
  },
  lilcluster: {
    description: "smallish clusters",
    lifespan: 128,
    maxDist: 16,
    minDist: 3,
    branchLength: 2,
    attractors: 5000,//25000,
    angle: 7,
    canvasSize: 540*2, /*540 * 2*/
    steering: /* src: tree.js */Tree.steeringOptions.ROUNDING,
    distortion: /* src: tree.js */Tree.distortionOptions.SINWAVE1,
    colorWay: [
      "#FFFFFF",
      // "#202d95"
    ],
    seed: "go for it woooo",
  }, 
  rhizomes1: {
    description: "for minting to rhizomes",
    lifespan: 128,
    maxDist: 16,
    minDist: 3,
    branchLength: 2,
    attractors: 5000,//25000,
    angle: 7,
    canvasSize: 540*2,//540*2, /*540 * 2*/
    steering: /* src: tree.js */Tree.steeringOptions.ROUNDING,
    distortion: /* src: tree.js */Tree.distortionOptions.SINWAVE1,
    contain: true,
    bite: true,
    strokeWeight: 3,
    colorWay: [
      "#FFFFFF",
      // "#202d95"
    ],
    seed: "get to the root of it",
    showVertices: true,
  }, 
  rhizomes2: {
    description: "coloured rhizomes",
    lifespan: 128,
    maxDist: 16,
    minDist: 3,
    branchLength: 2,
    attractors: 5000,//25000,
    roots: 3,
    angle: 7,
    canvasSize: 540,//540*2, /*540 * 2*/
    steering: /* src: tree.js */Tree.steeringOptions.ROUNDING,
    distortion: /* src: tree.js */Tree.distortionOptions.SINWAVE1,
    contain: true,
    bite: true,
    strokeWeight: 3,
    colorWay: [
      "#b7cdbcff",
      "#b9d4c5ff",
      "#a8c9beff",
      "#aed8d4ff",
      "#c9a8b3ff",
      "#bea8c9ff",
      "#c9bea8ff"
    ],
    seed: "get to the root of it",
    blobSteps: 4,
  }, 
};

export const CONFIG = presets.rhizomes2;
export function getConfig() { return CONFIG };