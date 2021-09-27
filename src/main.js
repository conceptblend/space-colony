/// <reference path="../node_modules/@types/p5/global.d.ts" />

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
/* /EXPORT CONFIGURATION */

/**
 * ==== GLOBALS initialization
 */
let iterations = CONFIG.lifespan;
let isRunning = false;

let t_start = null;
let t_end = null;

let bgColor;
let fgColor;

// Parameter I/O
let controlContainer,
    io_angle,
    io_branchLength,
    io_steering,
    io_export,
    io_run,
    io_exportNow;

/* /GLOBALS initialization */

function setup() {
  /**
   * ==== ENVIRONMENT initialization
   */
  if ( EXPORTMETHOD.id === EXPORT_METHODS.svg.id ) {
    createCanvas( CONFIG.canvasSize, CONFIG.canvasSize, SVG ); // MUCH SLOWER but necessary for the SVG exports
  } else {
    createCanvas( CONFIG.canvasSize, CONFIG.canvasSize ); // Good for testing or for digital outputs
  }
  angleMode( DEGREES );
  
  bgColor = color(238, 225, 221);
  fgColor = color(0,0,0); //color(34, 152, 152);
  
  background(bgColor);
  // Optimization when drawing only the stroke
  noFill();
  stroke( fgColor );
  strokeWeight( 4 );
  // End optimization
  /* /ENVIRONMENT init */

  controlContainer = createDiv('');
  controlContainer.id("controls");
  
  io_angle = createInput( CONFIG.angle, 'number' );
  io_branchLength = createInput( CONFIG.branchLength, 'number' );
  io_export = createCheckbox( "Export when done", EXPORT );
  io_run = createButton("Run");
  io_run.mouseClicked(e => initDrawing() );

  io_exportNow = createButton( "Export image and config" );
  io_exportNow.mouseClicked( e => saveImage() );

  io_steering = createSelect();
  io_steering.option( "No steering", STEERING_OPTIONS.NONE );
  io_steering.option( "Rounded", STEERING_OPTIONS.ROUNDING );
  io_steering.option( "Left-rounded", STEERING_OPTIONS.LEFT_ROUNDING );
  io_steering.option( "Right-rounded", STEERING_OPTIONS.RIGHT_ROUNDING );
  io_steering.selected( CONFIG.steering );
  
  controlContainer.child( io_angle );
  controlContainer.child( io_branchLength );
  controlContainer.child( io_steering );
  controlContainer.child( io_run );
  controlContainer.child( io_exportNow );
  controlContainer.child( io_export );
  
  // initDrawing();
  noLoop();
}

function initDrawing() {
  /**
   * ==== DRAWING initialization
   */

  iterations = CONFIG.lifespan;

  tree = new Tree({
    width: CONFIG.canvasSize,
    height: CONFIG.canvasSize,
    numLeaves: CONFIG.attractors,
    branchLength: parseInt( io_branchLength?.value() ) ?? CONFIG.branchLength,
    maxDist: CONFIG.maxDist,
    minDist: CONFIG.minDist,
    angle: parseInt( io_angle?.value() ) ?? CONFIG.angle,
    steering: parseInt( io_steering?.selected() ) ?? CONFIG.steering,
  });

  
  /* /DRAWING init */
  clear();
  loop();
  console.log("Drawing...");
  isRunning = true;
  t_start = Date.now();
}


function draw() {
  if ( !isRunning ) return;

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
    if ( io_export?.checked() ?? EXPORT ) {
      saveImage();
    }

    noLoop();
  }
}

function saveImage() {

  let cfg = tree.currentConfig();
  cfg.attractors = CONFIG.attractors;
  cfg.lifespan = CONFIG.lifespan;

  let name = `SpaceColonization-Bizarre-min_${cfg.minDist}-max_${cfg.maxDist}-lifespan_${cfg.lifespan}-attrCount_${cfg.attractors}-N_${cfg.angle}-length_${cfg.branchLength}-${new Date(t_start).toISOString()}`;
  // Export the image
  save( `${name}.${EXPORTMETHOD.extension}` );
  // Export the configuration
  saveJSON( cfg, `${name}.config.json` );

}