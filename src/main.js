/// <reference path="../node_modules/@types/p5/global.d.ts" />

// Inspired by:
// Daniel Shiffman
// http://patreon.com/codingtrain
// https://youtu.be/kKT0v3qhIQY

// Runtime: 8.7s @ l:200, max:64, min:16, canvas:1080,count:5000
// Runtime: 28.4s @ l:200, max:64, min:16, canvas:1080,count:25000

const SHOWINPROGESS = true;
let DRAW_FLOWFIELD = !true;

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
const EXPORTMETHOD = EXPORT_METHODS.png;
/* /EXPORT CONFIGURATION */

/**
 * ==== GLOBALS initialization
 */

let tree;

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
    io_exportNow,
    io_useDistortion;

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

  const colorWay = CONFIG.colorWay ?? [
    "#4a6670ff",
    "#565c76ff",
    "#6d6498ff",
    "#707398ff",
    "#78a493ff",
    "#7ea791ff",
    "#989570ff",
    "#987073ff",
    "#739870ff"
  ];

  const getColorWay = () => colorWay[ Math.floor( Math.random() * colorWay.length ) ];
  
  bgColor = color( getColorWay() ); // color("#00152B");//color(255); //color(238, 225, 221);
  fgColor = color( "#523333" );; //color("#045A82");//color(0); // color(0,0,0); //color(34, 152, 152);
  
  background(bgColor);
  // Optimization when drawing only the stroke
  noFill();
  stroke( fgColor );
  strokeWeight( 2 ); // 16
  // End optimization
  /* /ENVIRONMENT init */

  controlContainer = createDiv('');
  controlContainer.id("controls");
  
  io_angle = createInput( CONFIG.angle, 'number' );
  io_branchLength = createInput( CONFIG.branchLength, 'number' );
  io_export = createCheckbox( "Export when done", EXPORT );
  io_showFlowField = createCheckbox( "Show flow field", DRAW_FLOWFIELD );
  io_run = createButton("Run");
  io_run.mouseClicked(e => initDrawing() );

  io_exportNow = createButton( "Export image and config" );
  io_exportNow.mouseClicked( e => saveImage() );

  io_steering = createSelect();
  io_steering.option( "No steering", Tree.steeringOptions.NONE );
  io_steering.option( "Rounded", Tree.steeringOptions.ROUNDING );
  io_steering.option( "Left-rounded", Tree.steeringOptions.LEFT_ROUNDING );
  io_steering.option( "Right-rounded", Tree.steeringOptions.RIGHT_ROUNDING );
  io_steering.selected( CONFIG.steering );

  io_useDistortion = createSelect();
  io_useDistortion.option( "No distortion", Tree.distortionOptions.NONE );
  io_useDistortion.option( "Sine wave 1", Tree.distortionOptions.SINWAVE1 );
  io_useDistortion.option( "Sine wave 2", Tree.distortionOptions.SINWAVE2 );
  io_useDistortion.option( "Sine wave 3", Tree.distortionOptions.SINWAVE3 );
  io_useDistortion.option( "Warp", Tree.distortionOptions.WARP );
  io_useDistortion.option( "Flow", Tree.distortionOptions.FLOW );
  io_useDistortion.selected( CONFIG.distortion ?? Tree.distortionOptions.NONE );
  
  controlContainer.child( io_angle );
  controlContainer.child( io_branchLength );
  controlContainer.child( io_steering );
  controlContainer.child( io_useDistortion );
  controlContainer.child( io_run );
  controlContainer.child( io_exportNow );
  controlContainer.child( io_export );
  controlContainer.child( io_showFlowField );
  
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
    distortion: parseInt( io_useDistortion.selected() ) ?? Tree.distortionOptions.FLOW,
    fluidDistortion: new FluidDistortion({
      cols: 20,
      rows: 20,
      k: 0.00085,
    })
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
  
  DRAW_FLOWFIELD = io_showFlowField.checked() && ( io_useDistortion.selected() === Tree.distortionOptions.FLOW );

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

    // %%%%%%%%%%%%%%%%%
    // SHOW THE FLOW FIELD
    if ( DRAW_FLOWFIELD ) {
      push();
      let stepSizeX = width / tree.fluidDistortion.cols;
      let stepSizeY = height / tree.fluidDistortion.rows;

      for ( let h=0, hlen = tree.fluidDistortion.rows; h<hlen; h++ ) {
        for ( let w=0, wlen = tree.fluidDistortion.cols; w<wlen; w++ ) {
          let dir = tree.fluidDistortion.getDirection( w, h );
          let mag = tree.fluidDistortion.getMagnitude( w, h );
          
          stroke("#eee");
          strokeWeight( 1 );
          let ww = w * stepSizeX + stepSizeX * 0.5;
          let hh = h * stepSizeY + stepSizeY * 0.5;

          ellipse( ww, hh, 3, 3 );
          line(
            ww,
            hh,
            ww + Math.cos( dir*360 ) * (mag * 20),
            hh + Math.sin( dir*360 ) * (mag * 20)
          );
        }
      }
      pop();
    }
    // %%%%%%%%%%%%%%%%%

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