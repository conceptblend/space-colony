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
const EXPORTMETHOD = EXPORT_METHODS.svg;
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

const enumContainOptions = {
  NONE: 0,
  CENTERED_CIRCLE: 1,
  UNIONED_CIRCLES: 2,
  DOME: 4,
  EQUITRIANGLE: 8,
  HEART: 16,
}

const sdfCircle = ( x, y, cx, cy, r ) => {
  const dx = x - cx;
  const dy = y - cy;

  return r - Math.sqrt( dx * dx + dy * dy );
}

const sdfEquiTriangle = ( x, y, cx, cy, r ) => {
  const k = Math.sqrt(3.0);
  // p.x = abs(p.x) - 1.0;
  const dx = Math.abs( x - cx ) - r;

  // p.y = p.y + 1.0/k;
  const dy = ( y + 1.4*r/k ) - cy;

  let nx = dx, ny = dy;
  
  // if( p.x+k*p.y>0.0 ) p = vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;
  if( dx + k * dy > 0.0 ) {
    nx = ( dx - k * dy ) / 2.0;
    ny = ( -k * dx - dy ) / 2.0;
  }

  nx -= Math.min( Math.max( nx, -2.0 * r), 0.0 ); // clamp -2..0
  return Math.sqrt( nx * nx + ny * ny ) * Math.sign(ny);
}

// r=radius, h=height
const sdfCutDisk = ( x, y, cx, cy, r, h ) => {
  // Modified from Inigo Quilez: https://www.shadertoy.com/view/ftVXRc

  const w = Math.sqrt( r*r - h*h ); // constant for a given shape

  const dx = Math.abs( x - cx );
  const dy = cy - y; // inverted to create a bush

  // select circle or segment
  const s = Math.max( ( h-r )* dx * dx + w * w * ( h + r - 2.0 * dy ), h * dx - w * dy );

  const dx2 = dx - w;
  const dy2 = dy - h;

  return -1 * ( (s < 0.0) ? Math.sqrt( dx*dx + dy*dy ) - r :        // circle
          (dx < w) ? h - dy     :        // segment line
          Math.sqrt( dx2*dx2 + dy2*dy2 )); // segment corner
}

const sdfHeart = ( x, y, cx, cy, _scale ) => {
  // For the constants in this SDF to work, I believe (x,y) need to be
  // normalized from 0..1.
  let scale = _scale * 0.75;
  // Normalize and reflect
  const dx = Math.abs( x - cx ) / scale;
  // Normalize and translate
  const dy = 0.25 + 1.0 - ( y / scale );
  
  let dd, nx, ny;

  if ( dy + dx > 1.0 ) {
    nx = dx - 0.25;
    ny = dy - 0.75;

    dd = Math.sqrt( nx * nx + ny * ny ) - (Math.SQRT2 / 4.0);
  } else {
    let n1 = {
      x: dx,
      y: dy - 1.0
    }
    let sub = 0.5 * Math.max( dx + dy, 0 );
    let n2 = {
      x: dx - sub,
      y: dy - sub
    }

    let d1 = n1.x * n1.x + n1.y * n1.y;
    let d2 = n2.x * n2.x + n2.y * n2.y;
    
    dd = Math.sqrt( Math.min( d1, d2 ) ) * Math.sign( dx - dy );
  }
  return -dd;
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

  // Give the CONFIG a default drawing function
  if ( undefined === CONFIG.fnShow ) CONFIG.fnShow = Polyline.drawingOptions.line;
  if ( undefined === CONFIG.showVertices ) CONFIG.showVertices = false;
  if ( undefined === CONFIG.containMethod ) CONFIG.containMethod = enumContainOptions.CENTERED_CIRCLE;
  if ( undefined === CONFIG.roots ) CONFIG.roots = 1;
  if ( undefined === CONFIG.tension ) CONFIG.tension = 0.4;

  gui = new dat.gui.GUI();

  gui.remember(CONFIG);

  gui.add(CONFIG, 'description');
  
  let f_branch = gui.addFolder('Branch');
  f_branch.add(CONFIG, 'roots', 1, 6).step(1);
  f_branch.add(CONFIG, 'branchLength', 1, 64).step(1);
  f_branch.add(CONFIG, 'lifespan', 1, 256).step(1);
  f_branch.add(CONFIG, 'minDist', 1, 256).step(1);
  f_branch.add(CONFIG, 'maxDist', 1, 256).step(1);

  let f_steering = gui.addFolder('Steering');
  
  f_steering.add(CONFIG, 'steering', Tree.steeringOptions);
  f_steering.add(CONFIG, 'angle', 1, 180).step(1);

  let f_style = gui.addFolder('Style');
  f_style.add(CONFIG, 'fnShow', Polyline.drawingOptions);
  f_style.add(CONFIG, 'showVertices');
  f_style.add(CONFIG, 'strokeWeight', 1, 256).step(1);
  f_style.add(CONFIG, 'tension', -2, 2).step(.1);

  let f_attractors = gui.addFolder('Attractors');
  f_attractors.add(CONFIG, 'attractors', 100, 25000).step(1);
  f_attractors.add(CONFIG, 'contain');
  f_attractors.add(CONFIG, 'containMethod', enumContainOptions);
  f_attractors.add(CONFIG, 'bite');
  f_attractors.add(CONFIG, 'distortion', Tree.distortionOptions);

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

  bgColor = color( "#F4E8C9" ); //color( getColorWay() ); // color("#00152B");//color(255); //color(238, 225, 221);
  fgColor = color( 0 ); //color( "#523333" );; //color("#045A82");//color(0); // color(0,0,0); //color(34, 152, 152);

  background( bgColor );
  // Optimization when drawing only the stroke
  noFill();
  stroke( fgColor );
  strokeWeight( CONFIG.strokeWeight ?? 2 ); // 16

  iterations = CONFIG.lifespan;

  // %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

  let attractors = [];
  let weight = 0;
  const offset = CONFIG.canvasSize * 0.1;
  const ns = CONFIG.canvasSize - 2 * offset;
  const cx = ns * 0.5;
  const cy = ns * 0.5;

 
  for (var i = 0, len = CONFIG.attractors; i < len; i++) {
    weight = Math.ceil( Math.random() * 10 );
    // Skip if the leaf/attractor would be outside the circle
    const x = Math.floor( Math.random() * ns );
    const y = Math.floor( Math.random() * ns );


    let sdfContainer = 1;
    if ( CONFIG.contain ) {
      switch ( Number.parseInt( CONFIG.containMethod )) {
        case enumContainOptions.NONE:
          break; // seems dumb to have this option... but it's for back compat
        case enumContainOptions.UNIONED_CIRCLES:
          // Two circles, unioned at the center
          sdfContainer = sdfCircle( x, y, cx, ns * 0.1, 4*offset ) > 0 || sdfCircle( x, y, cx, ns * 0.9, 4*offset ) > 0 ? 1 : -1;
          break;
        case enumContainOptions.DOME:
          // A dome-shaped cut disk nearly centered at the canvas midpoints
          sdfContainer = sdfCutDisk( x, y, cx, ns * 0.65, 4*offset, -offset );
          break;
        case enumContainOptions.EQUITRIANGLE:
          sdfContainer = sdfEquiTriangle( x, y, cx, cy, 4*offset );
          break;
          case enumContainOptions.HEART:
            sdfContainer = sdfHeart( x, y, cx, cy, ns );
            break;
        case enumContainOptions.CENTERED_CIRCLE:
        default:
          sdfContainer = sdfCircle( x, y, cx, cy, 4*offset );
          break;
      }
    }

    const sdfBite = CONFIG.bite ? -sdfCircle( x, y, cx, cy, 2*offset ) : 1;
    
    if ( sdfContainer > 0 && sdfBite > 0 ) {
      attractors.push(new Attractor(
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
    numRoots: CONFIG.roots,
    attractors: attractors,
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
    }),
    fnShow: v => {
      // TODO: extract the decision-making and just pass the resultant function
      ( CONFIG.fnShow & Polyline.drawingOptions.line ) && Polyline.drawPolyline( v );
      ( CONFIG.fnShow & Polyline.drawingOptions.knuckles ) && Polyline.drawPolylineKnuckles( v );
      ( CONFIG.fnShow & Polyline.drawingOptions.vertices ) && Polyline.drawPolyVertices( v );
      ( CONFIG.fnShow & Polyline.drawingOptions.blobVerts ) && Polyline.drawPolyBlobVertices( v );
      ( CONFIG.fnShow & Polyline.drawingOptions.blobVertsPlus ) && Polyline.drawPolyBlobVerticesPlus( v );
      ( CONFIG.fnShow & Polyline.drawingOptions.blobVertsPlusPlus ) && Polyline.drawPolyBlobVerticesPlusPlus( v );
      ( CONFIG.fnShow & Polyline.drawingOptions.blobVertsFilled ) && Polyline.drawPolyBlobVerticesFilled( v );
      ( CONFIG.fnShow & Polyline.drawingOptions.blobVertsTranslucent ) && Polyline.drawPolyBlobVerticesTranslucent( v );    
    }
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

  if ( iterations-- > 0 && tree.attractors.length > 0 ) {
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
  let cfg = Object.assign( {}, CONFIG );

  // Coerce the HEX values back to INTs so they don't end up a strings
  // TODO: SHould probably avoid creating enums using HEX values in the future,
  cfg.steering = Number.parseInt( cfg.steering );
  cfg.distortion = Number.parseInt( cfg.distortion );
  cfg.fnShow = Number.parseInt( cfg.fnShow );

  // Extend with the fluid distorting settings just in case
  cfg.meta = {
    fluidDistortion: ( tree.currentConfig() ).fluidDistortion,
  };
  saveJSON( cfg, `${getName()}-config.json` );
}

function downloadOutput() {
  saveImage( EXPORTMETHOD.extension );
  saveConfig();
}

// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
