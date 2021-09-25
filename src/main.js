// Inspired by:
// Daniel Shiffman
// http://patreon.com/codingtrain
// https://youtu.be/kKT0v3qhIQY

// Runtime: 8.7s @ l:200, max:64, min:16, canvas:1080,count:5000
// Runtime: 28.4s @ l:200, max:64, min:16, canvas:1080,count:25000

let tree;

const SHOWINPROGESS = true;
/**
 * ==== EXPORT CONFIGURATION
 */
const EXPORT = true;
const EXPORT_METHODS = {
  svg: {
    id: 0x01,
    extension: "svg"
  },
  jpg: {
    id: 0x02,
    extension: "jpg"
  },
  png: {
    id: 0x03,
    extension: "png"
  },
};
const EXPORTMETHOD = EXPORT_METHODS.jpg;
/* /EXPORT CONFIGURATION */

/**
 * ==== GLOBALS initialization
 */
let iterations = CONFIG.lifespan;

let t_start = null;
let t_end = null;

let bgColor;
let fgColor;
/* /GLOBALS initialization */

function setup() {
  /**
   * ==== ENVIRONMENT initialization
   */
  if ( EXPORT && EXPORTMETHOD.id === EXPORT_METHODS.svg.id ) {
    createCanvas(CONFIG.canvasSize, CONFIG.canvasSize, SVG); // MUCH SLOWER but necessary for the SVG exports
  } else {
    createCanvas(CONFIG.canvasSize, CONFIG.canvasSize); // Good for testing or for digital outputs
  }
  angleMode(DEGREES);
  
  bgColor = color(238, 225, 221);
  fgColor = color(0,0,0); //color(34, 152, 152);
  
  background(bgColor);
  // Optimization when drawing only the stroke
  noFill();
  stroke(fgColor);
  strokeWeight(4);
  // End optimization
  /* /ENVIRONMENT init */

  /**
   * ==== DRAWING initialization
   */
  tree = new Tree({
    width: CONFIG.canvasSize,
    height: CONFIG.canvasSize,
    numLeaves: CONFIG.attractors,
    branchLength: CONFIG.branchLength,
    maxDist: CONFIG.maxDist,
    minDist: CONFIG.minDist,
    angle: CONFIG.angle,
  });

  t_start = Date.now();
  /* /DRAWING init */
  console.log("Drawing...");
}


function draw() {
  if ( iterations-- > 0 && tree.leaves.length > 0 ) {
    tree.grow();

    // To speed up generation, turn this off
    if ( SHOWINPROGESS ) {
      clear(); // for SVG this clears left-overs
      background( bgColor);
      tree.show();
    }
  } else {
    t_end = Date.now();
    background( bgColor );

    tree.joinAndShow();

    console.log( `Runtime: ${( t_end - t_start )/1000}s` );
    if ( EXPORT ) {
      save( `SpaceColonization-Bizarre-min_${CONFIG.minDist}-max_${CONFIG.maxDist}-lifespan_${CONFIG.lifespan}-attrCount_${CONFIG.attractors}-N_${CONFIG.angle}-length_${CONFIG.branchLength}-${new Date(t_start).toISOString()}.${EXPORTMETHOD.extension}` );
    }

    noLoop();
  }
}