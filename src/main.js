/// <reference path="../node_modules/@types/p5/global.d.ts" />

// Inspired by:
// Daniel Shiffman
// http://patreon.com/codingtrain
// https://youtu.be/kKT0v3qhIQY

import { CONFIG } from './modules/presets.js';
import Tree from './modules/tree.js';
import Attractor from './modules/attractor.js';
import Polyline from './modules/polyline.js';
import FluidDistortion from './modules/fluiddistortion.js';
import { SVG } from '../lib/svg.esm.js';
import Vector2d from './modules/vector2d.js';

let __SVGCTX;

window.DEBUG = !true;
const SHOWINPROGESS = !true;

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

// Parameter I/O
let gui;
let guiActions;

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

// Expose to `window` context so P5 can access it
window.setup = function() {
  /**
   * ==== ENVIRONMENT initialization
   */
   __SVGCTX = SVG()
   .addTo('#render')
   .size( CONFIG.canvasSize, CONFIG.canvasSize )
   .viewbox(`0 0 ${ CONFIG.canvasSize } ${ CONFIG.canvasSize }`);

  // strokeJoin( ROUND );
  /* /ENVIRONMENT init */

  // Give the CONFIG a default drawing function
  if ( undefined === CONFIG.fnShow ) CONFIG.fnShow = Polyline.drawingOptions.line;
  if ( undefined === CONFIG.showVertices ) CONFIG.showVertices = false;
  if ( undefined === CONFIG.containMethod ) CONFIG.containMethod = enumContainOptions.CENTERED_CIRCLE;
  if ( undefined === CONFIG.roots ) CONFIG.roots = 1;
  if ( undefined === CONFIG.tension ) CONFIG.tension = 0.4;
  if ( undefined === CONFIG.showQuadTree ) CONFIG.showQuadTree = true;

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
  f_style.add(CONFIG, 'showQuadTree');
  f_style.add(CONFIG, 'strokeWeight', 1, 256).step(1);
  f_style.add(CONFIG, 'tension', -2, 2).step(.1);

  let f_attractors = gui.addFolder('Attractors');
  f_attractors.add(CONFIG, 'attractors', 100, 25000).step(1);
  f_attractors.add(CONFIG, 'contain');
  f_attractors.add(CONFIG, 'containMethod', enumContainOptions);
  f_attractors.add(CONFIG, 'bite');
  f_attractors.add(CONFIG, 'distortion', Tree.distortionOptions);

  guiActions = {
    run: e => initDrawing( 1 ),
    runRandom: e => initDrawing( 1, Math.random() ),
    runRandomSeries: e => initDrawing( 5, Math.random() ),
    export: e => downloadOutput()
  };

  gui.add(guiActions, 'run');
  gui.add(guiActions, 'runRandom');
  gui.add(guiActions, 'runRandomSeries');
  gui.add(guiActions, 'export');
}

let seriesLength = 1;
function initDrawing( count, newSeed ) {
  /**
   * ==== DRAWING initialization
   */
  seriesLength = count;

  CONFIG.seed = newSeed ? newSeed : CONFIG.seed ?? Math.random();
  Math.seedrandom( CONFIG.seed )
  /**
   * IMPORTANT:
   * If you omit seeding the noise, the first pass is distinct from all
   * others because the first call to noise() will generate a random number but
   * subsequent calls do not. Thus, the sequence is disrupted on the first pass.
   **/

  // TODO: REPLACE once p5.js is removed
  noise.seed( CONFIG.seed );
  // noiseSeed( CONFIG.seed );
  /** /IMPORTANT */

  // const colorWay = CONFIG.colorWay ?? [
  //   "#4a6670",
  //   "#565c76",
  //   "#6d6498",
  //   "#707398",
  //   "#78a493",
  //   "#7ea791",
  //   "#989570",
  //   "#987073",
  //   "#739870"
  // ];
  CONFIG.colorWay = [
    "#689bdb",
    "#e48eab",
    "#b9dbd8",
    "#7293d6",
    "#cf97a1",
    "#ccd575",
    "#d6b572",
    "#d67293",
    "#93d672"
    // --
    // "#e3a886",
    // "#e6c682",
    // "#e5cb94",
    // "#cee08d",
    // "#8acfc3",
    // "#73d6d0",
    // "#7164d2",
    // "#df5ec2",
    // "#cf8a95",
    // "#c38acf",
    // "#cfc38a"
    // --
    // "#dc8875",
    // "#d4806a",
    // "#b4d067",
    // "#91f479",
    // "#7ddf73",
    // "#7cf4ce",
    // "#dc79f4",
    // "#7991f4",
    // "#f47991"
  ];
 
  // const getColorWay = () => colorWay[ Math.floor( Math.random() * colorWay.length ) ];
  const pickNofM = ( n, m ) => {
    let set = [],
        cp = [ ...m ];

    for( let i = 0; i < n; i++ ) {
      let c = cp.splice( Math.floor( Math.random() * cp.length ), 1 );
      if ( c === undefined ) break; // over reached
      set.push( c[0] );
    }
    return set;
  }

  let colonyFills = pickNofM( 3, CONFIG.colorWay ),
      qtFill = colonyFills[ colonyFills.length-1 ]; //pickNofM( 1, colonyFills );//"#E7F0CE";//pickNcolours( 1 )[ 0 ];//"#DFF0F1"
  window.theme = {
    colony: {
      stroke: "#000",
      fills: colonyFills
    },
    quadtree: {
      fills: [
        "#fff",
        qtFill,
      ],
      stroke: qtFill
    }
  }

  __SVGCTX.clear();
  __SVGCTX.rect( CONFIG.canvasSize, CONFIG.canvasSize ).fill( window.theme.quadtree.fills[0] );

  
  // Optimization when drawing only the stroke
  // TODO: Replace after p5.js is removed
  // stroke( fgColor );
  // strokeWeight( CONFIG.strokeWeight ?? 2 ); // 16

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
        new Vector2d(offset + x, offset + y),
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
    fnShow: ( ctx, v ) => {
      // TODO: extract the decision-making and just pass the resultant function
      ( CONFIG.fnShow & Polyline.drawingOptions.line ) && Polyline.drawPolyline( v, ctx );
      ( CONFIG.fnShow & Polyline.drawingOptions.knuckles ) && Polyline.drawPolylineKnuckles( v, ctx );
      ( CONFIG.fnShow & Polyline.drawingOptions.vertices ) && Polyline.drawPolyVertices( v, ctx );
      ( CONFIG.fnShow & Polyline.drawingOptions.blobVerts ) && Polyline.drawPolyBlobVertices( v, ctx );
      ( CONFIG.fnShow & Polyline.drawingOptions.blobVertsPlus ) && Polyline.drawPolyBlobVerticesPlus( v, ctx );
      ( CONFIG.fnShow & Polyline.drawingOptions.blobVertsPlusPlus ) && Polyline.drawPolyBlobVerticesPlusPlus( v, ctx );
      ( CONFIG.fnShow & Polyline.drawingOptions.blobVertsFilled ) && Polyline.drawPolyBlobVerticesFilled( v, ctx );
      ( CONFIG.fnShow & Polyline.drawingOptions.blobVertsTranslucent ) && Polyline.drawPolyBlobVerticesTranslucent( v, ctx );    
    }
  });

  
  /* /DRAWING init */

  console.log("Drawing...");
  isRunning = true;
  t_start = Date.now();
  loop();
}

window.loop = function() {
  window.isLooping = true;
  window.tick();
}
window.noLoop = function() {
  window.isLooping = false;
}
window.tick = function() {
  window.draw();
  if ( !window.isLooping ) return;
  requestAnimationFrame( window.tick );
}
// Expose to `window` context so P5 can access it
window.draw = function() {
  if ( !isRunning ) return;

  if ( iterations-- > 0 && tree.attractors.length > 0 ) {
    tree.grow();

    // To speed up generation, turn this off
    // if ( SHOWINPROGESS ) {
    //   __SVGCTX.clear();
    //   __SVGCTX.rect( CONFIG.canvasSize, CONFIG.canvasSize ).fill( window.theme.quadtree.fills[0] );
      
    //   tree.show( __SVGCTX );
    // }
  } else {
    t_end = Date.now();
    noLoop();
    isRunning = false;

    __SVGCTX.clear();
    __SVGCTX.rect( CONFIG.canvasSize, CONFIG.canvasSize ).fill( window.theme.quadtree.fills[0] );

    tree.joinAndShow( __SVGCTX );

    // Group the blobs if they exist
    let blobs = document.querySelectorAll('svg .blob');
    if ( blobs.length ) {
      let g = __SVGCTX.group().attr('id', 'blobs');
      blobs.forEach( b => g.add( b ));
    }

    console.log( `Runtime: ${( t_end - t_start )/1000}s` );

    if ( --seriesLength >= 0 ) {
      downloadOutput();
      seriesLength && initDrawing( seriesLength, Math.random() )
    }
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

function saveImage( ext = 'svg' ) {
  const url = URL.createObjectURL(new Blob([ __SVGCTX.svg() ], {type: "image/svg+xml"}));
  downloadBlob( url, `${ getName() }.${ ext }` );
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

  const data = JSON.stringify( cfg, null, 2 );
  const url = URL.createObjectURL(new Blob([ data ], {type: "application/json"}));
  downloadBlob( url, `${getName()}-config.json` );
}

function downloadBlob( url, filename ) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `Untitled ${Date.now() }`;
  a.style.display = 'none';

  a.onclick = e => {
    document.body.removeChild(e.target);
    e.stopPropagation();
  };

  document.body.appendChild(a);
  a.click();
}

function downloadOutput() {
  saveImage( EXPORTMETHOD.extension );
  saveConfig();
}

// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%


window.setup();

