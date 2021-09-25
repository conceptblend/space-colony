// Inspired by:
// Daniel Shiffman
// http://patreon.com/codingtrain
// https://youtu.be/kKT0v3qhIQY

// Runtime: 8.7s @ l:200, max:64, min:16, canvas:1080,count:5000
// Runtime: 28.4s @ l:200, max:64, min:16, canvas:1080,count:25000

var tree;

const LIFESPAN = CONFIG.lifespan; // 48, 96, 200
const /*tree.*/MAXDIST = CONFIG.maxDist; // 48, 24
// Open when min is greater than BRANCH_LENGTH, closed when smaller
const /*tree.*/MINDIST = CONFIG.minDist; // 8 
const BRANCH_LENGTH = CONFIG.branchLength;
const MAXDIST_3 = MAXDIST * 3.0;
const MAXDIST_3over2 = MAXDIST_3 * 0.5;
const /*tree.*/N = CONFIG.angle; // angle in DEGREES: 90 and 120 make good geometry
  // ^^^ Also tried weird values like 75 deg and 15 deg
const CANVASSIZE = CONFIG.canvasSize;
const ATTRACTORCOUNT = CONFIG.attractors; // 25000
const SHOWINPROGESS = true;

const EXPORT = !true;
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

let iterations = LIFESPAN;

let t_start = null;
let t_end = null;

let bgColor;
let fgColor;

function setup() {
  if ( EXPORT && EXPORTMETHOD.id === EXPORT_METHODS.svg.id ) {
    createCanvas(CANVASSIZE, CANVASSIZE, SVG); // MUCH SLOWER but necessary for the SVG exports
  } else {
    createCanvas(CANVASSIZE, CANVASSIZE); // Good for testing or for digital outputs
  }
  tree = new Tree(ATTRACTORCOUNT, BRANCH_LENGTH);
  angleMode(DEGREES);
  
  bgColor = color(238, 225, 221);
  fgColor = color(0,0,0); //color(34, 152, 152);
  
  background(bgColor);
  // Optimization when drawing only the stroke
  noFill();
  stroke(fgColor);
  strokeWeight(4);
  // End optimization
  
  t_start = Date.now();
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
      save( `SpaceColonization-Bizarre-min_${MINDIST}-max_${MAXDIST}-lifespan_${LIFESPAN}-attrCount_${ATTRACTORCOUNT}-N_${N}-length_${BRANCH_LENGTH}-${new Date(t_start).toISOString()}.${EXPORTMETHOD.extension}` );
    }

    noLoop();
  }
}