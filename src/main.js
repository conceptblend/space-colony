/// <reference path="../node_modules/@types/p5/global.d.ts" />

// Inspired by:
// Daniel Shiffman
// http://patreon.com/codingtrain
// https://youtu.be/kKT0v3qhIQY


const DEBUG = !true;
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
let gui;
let guiActions;

/**
 * return TRUE if a is within delta of b
 * return FALSE otherwise
 **/
 function nearEqual( a, b, deltaOverride ) {
  if (a === Infinity && b === Infinity ) return true;
  if (a === -Infinity && b === -Infinity ) return true;
  const delta = deltaOverride ?? 0.025; // ≥ 0.05 introduces loss
  return Math.abs(b - a) < delta;
}

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
  strokeJoin( ROUND );
  // End optimization
  /* /ENVIRONMENT init */

  gui = new dat.gui.GUI();

  gui.remember(CONFIG);

  gui.add(CONFIG, 'description');
  
  let f_branch = gui.addFolder('Branch');

  f_branch.add(CONFIG, 'branchLength', 1, 64).step(1);
  f_branch.add(CONFIG, 'lifespan', 1, 256).step(1);
  f_branch.add(CONFIG, 'minDist', 1, 256).step(1);
  f_branch.add(CONFIG, 'maxDist', 1, 256).step(1);
  f_branch.add(CONFIG, 'strokeWeight', 1, 256).step(1);
  f_branch.add(CONFIG, 'showVertices');

  let f_steering = gui.addFolder('Steering');
  
  f_steering.add(CONFIG, 'steering', Tree.steeringOptions);
  f_steering.add(CONFIG, 'angle', 1, 180).step(1);

  let f_foodSources = gui.addFolder('Food');
  f_foodSources.add(CONFIG, 'attractors', 100, 25000).step(1);
  f_foodSources.add(CONFIG, 'contain');
  f_foodSources.add(CONFIG, 'bite');
  
  f_foodSources.add(CONFIG, 'distortion', Tree.distortionOptions);

  guiActions = {
    run: e => initDrawing(),
    runRandom: e => initDrawing( Math.random() ),
    export: e => downloadOutput()
  };

  gui.add(guiActions, 'run');
  gui.add(guiActions, 'runRandom');
  gui.add(guiActions, 'export');

  noLoop();
}

function initDrawing( newSeed ) {
  /**
   * ==== DRAWING initialization
   */

  CONFIG.seed = newSeed ? newSeed : CONFIG.seed ?? Math.random();
  Math.seedrandom( CONFIG.seed )
  /**
   * IMPORTANT:
   * If you omit seeding the noise, the first pass is distinct from all
   * others because the first call to noise() will generate a random number but
   * subsequent calls do not. Thus, the sequence is disrupted on the first pass.
   **/

  noiseSeed( CONFIG.seed );
  /** /IMPORTANT */

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

  background( bgColor );
  // Optimization when drawing only the stroke
  noFill();
  stroke( fgColor );
  strokeWeight( CONFIG.strokeWeight ?? 2 ); // 16

  iterations = CONFIG.lifespan;

  // %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

  let leaves = [];
  let weight = 0;
  let offset = CONFIG.canvasSize * 0.1;
  let ns = CONFIG.canvasSize - 2 * offset;
  
  for (var i = 0, len = CONFIG.attractors; i < len; i++) {
    weight = Math.ceil( Math.random() * 10 );
    // Skip if the leaf/attractor would be outside the circle
    let x = Math.floor( Math.random() * ns );
    let y = Math.floor( Math.random() * ns );

    let xr = x - ns * 0.5;
    let yr = y - ns * 0.5;
    let sdfContainer = CONFIG.contain ? 4*offset - Math.sqrt(xr * xr + yr * yr) : 1;
    let sdfBite = CONFIG.bite ? Math.sqrt(xr * xr + yr * yr) - 2*offset : 1;

    
    if ( sdfContainer > 0 && sdfBite > 0 ) {
      leaves.push(new Leaf(
        createVector(offset + x, offset + y),
        weight // weight
      ));
    }
  }
  
  // %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

  tree = new Tree({
    width: CONFIG.canvasSize,
    height: CONFIG.canvasSize,
    numLeaves: CONFIG.attractors,
    leaves: leaves,
    branchLength: CONFIG.branchLength ?? CONFIG.branchLength,
    maxDist: CONFIG.maxDist,
    minDist: CONFIG.minDist,
    angle: CONFIG.angle,
    steering: parseInt( CONFIG.steering ),
    distortion: parseInt( CONFIG.distortion ) ?? Tree.distortionOptions.FLOW,
    /* TODO: Always generating the FluidDistortion is wasteful. Reconsider. */
    fluidDistortion: new FluidDistortion({
      cols: CONFIG.canvasSize/20,
      rows: CONFIG.canvasSize/20,
      k: 0.00085,
    })
  });

  
  /* /DRAWING init */

  console.log("Drawing...");
  isRunning = true;
  t_start = Date.now();
  loop(); 
}


function draw() {
  if ( !isRunning ) return;
  clear();

  DRAW_FLOWFIELD = false; //TODO: add to dat.gui // io_showFlowField.checked() && ( io_useDistortion.selected() === Tree.distortionOptions.FLOW );

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
    isRunning = false;
    noLoop();
  }
}

// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function getName() {
  let cfg = tree.currentConfig();
  cfg.lifespan = CONFIG.lifespan;
  cfg.seed = CONFIG.seed;
  // Encode the parameters into the filename
  let params = MD5( JSON.stringify( cfg ) );
  return `SpaceColonization-${CONFIG.description.replace(/\s+/gi, '_')}-${params}-${new Date().toISOString()}`;
}

function saveImage( ext = 'png' ) {
  save(`${ getName() }.${ ext }`);
}

function saveConfig() {
  let cfg = tree.currentConfig();
  cfg.lifespan = CONFIG.lifespan;
  cfg.seed = CONFIG.seed;
  saveJSON( cfg, `${getName()}-config.json` );
}

function downloadOutput() {
  saveImage( EXPORTMETHOD.extension );
  saveConfig();
}

// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
