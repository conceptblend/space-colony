import { nearEqual } from "./utils.js";
import { getConfig } from "./presets.js";

const THRESHOLD = 0.25;

function getControlPoints(x0,y0,x1,y1,x2,y2,t){
  const d01 = Math.sqrt( Math.pow( x1 - x0, 2 ) + Math.pow( y1 - y0, 2 ));
  const d12 = Math.sqrt( Math.pow( x2 - x1, 2 ) + Math.pow( y2 - y1, 2 ));
  const fa = t * d01 / ( d01 + d12 );   // scaling factor for triangle Ta
  const fb = t * d12 / ( d01 + d12 );   // ditto for Tb, simplifies to fb=t-fa
  return [
    x1 - fa * ( x2 - x0 ),    // x2-x0 is the width of triangle T
    y1 - fa * ( y2 - y0 ),    // y2-y0 is the height of T
    x1 + fb * ( x2 - x0 ),
    y1 + fb * ( y2 - y0 )
  ];
}

function sampleArray( arr ) {
  return arr[ Math.floor( Math.random() * arr.length ) ];
}

function blob( ctx, x, y, r, useFill = false, c ) {
  const steps = getConfig().blobSteps ?? 6;
  const angleIncrement = 360 / steps;
  let blobPoints = [];
  const D = r*0.5,
        RAD = Math.PI / 180;
  for ( let n=0; n<steps; n++ ) {
    let angle = n * angleIncrement * RAD;
    blobPoints.push({
      x: x + Math.cos( angle ) * ( r + Math.random()*D ),
      y: y + Math.sin( angle ) * ( r + Math.random()*D )
    });
  }

  // Make a copy so we can augment the structure
  let vv = [ ...blobPoints ];
  const last = vv.length-1;
  const tension = getConfig().tension ?? 0.5;
  
  // Do a first pass to calculate all of the control points and store them with
  // each vertex for access when drawing.
  vv.forEach(( v, i ) => {
    /**
      Something is janky in this logic that bends the first and last
      vertices in an unexpected way when leaving it open. Fix it :)
    **/
    const v0i = ( i === 0   ) ? last : i-1;
    const v2i = ( i === last ) ? 0 : i+1; 
    const v0 = vv[ v0i ];
    const v2 = vv[ v2i ];
    
    const t = tension;//(( i === 0 || i === last ) && !closeIt ) ? 0 : tension;
    const controls = getControlPoints(
      v0.x, v0.y, v.x, v.y, v2.x, v2.y, t
    );
    v.cIn = {
      x: controls[ 0 ],
      y: controls[ 1 ]
    };
    v.cOut = {
      x: controls[ 2 ],
      y: controls[ 3 ]
    };
  });

  let curve = [];
  let path = `M${ vv[0].x } ${ vv[0].y } `;
  // Loop through the points and add the curve to the path
  for( let i=1; i < vv.length; i++ ){
    const v0 = vv[ i-1 ];
    const v1 = vv[ i   ];
    curve.push( v0.cOut.x, v0.cOut.y, v1.cIn.x, v1.cIn.y, v1.x, v1.y );
  };

  const v0 = vv[ last ];
  const v1 = vv[ 0 ];
  curve.push( v0.cOut.x, v0.cOut.y, v1.cIn.x, v1.cIn.y, v1.x, v1.y );
  path += `C${ curve.join(' ') }Z`;
  ctx
    .path( path )
    .fill( useFill ? c ?? "#000" : "none" )
    .stroke({ width: getConfig().strokeWeight, color: window.theme.colony.stroke ?? "#000" })
    .addClass('blob');
}
export default class Polyline {
  static drawingOptions = {
    line: 0x01,
    knuckles: 0x02,
    vertices: 0x04,
    blobVerts: 0x08,
    blobVertsPlus: 0x20,
    blobVertsPlusPlus: 0x40,
    blobVertsFilled: 0x80,
    blobVertsTranslucent: 0x10,
    linesAndBlobVerts: 0x01 + 0x08,
    linesAndBlobVertsPlus: 0x01 + 0x20,
    linesAndBlobVertsPlusPlus: 0x01 + 0x40,
    linesAndFilledBlobs: 0x01 + 0x80,
  }

  static drawPolyline( vertices, ctx, style ) {
    let myPolyline = [];

    vertices.forEach( v => {
      myPolyline.push([ v.pos.x, v.pos.y ]);
    });

    ctx.polyline( myPolyline ).fill('none').stroke( style ?? { width: getConfig().strokeWeight, color: window.theme.colony.stroke })
  }
  // Draw the polyline AND the vertices at a static size
  static drawPolyVertices( vertices, ctx, style ) {
    let myPolyline = [];
    let r = 1.5;
    
    vertices.forEach( v => {      
      myPolyline.push([ v.pos.x, v.pos.y ]);
      ctx.circle( r * 2 ).move( v.pos.x - r, v.pos.y - r ).stroke( "none" ).fill( style?.color ?? window.theme.colony.stroke);
    });
    ctx.polyline( myPolyline ).fill('none').stroke( style ?? { width: getConfig().strokeWeight, color: window.theme.colony.stroke })
  }
  // Draw the polyline AND the vertices at a dynamic size
  static drawPolylineKnuckles( vertices, ctx, style ) {
    let myPolyline = [];
    let r;

    vertices.forEach(( v, i ) => {
      myPolyline.push([ v.pos.x, v.pos.y ]);
      r = 2+i;
      ctx.circle( r * 2 ).move( v.pos.x - r, v.pos.y - r ).stroke( "none" ).fill( style?.color ?? window.theme.colony.stroke);
    });

    ctx.polyline( myPolyline ).fill('none').stroke( style ?? { width: getConfig().strokeWeight, color: window.theme.colony.stroke })
  }
  // Draw just blob vertices
  static drawPolyBlobVertices( vertices, ctx ) {
    const useFill = getConfig().useFill;
    vertices.forEach(( v, i ) => {
      blob( ctx, v.pos.x, v.pos.y, i+2, useFill, sampleArray( window.theme.colony.fills ) );
    });
  }
  // Draw blob vertices with an outer ring
  static drawPolyBlobVerticesPlus( vertices, ctx ) {
    const useFill = getConfig().useFill;
    vertices.forEach(( v, i ) => {
      blob( ctx, v.pos.x, v.pos.y, i+2, useFill, sampleArray( window.theme.colony.fills ) );
      if( i % 2 === 0 ) {
        blob( ctx, v.pos.x, v.pos.y, i+5, false );
      }
    });
  }
  // Draw blob vertices with multiple outer rings
  static drawPolyBlobVerticesPlusPlus( vertices, ctx ) {
    vertices.forEach(( v, i ) => {
      const n = i+2;
      // blob( ctx, v.pos.x, v.pos.y, 4*n, false ) );
      blob( ctx, v.pos.x, v.pos.y, 3*n, false );
      blob( ctx, v.pos.x, v.pos.y, 2*n, true, sampleArray( window.theme.colony.fills ) );
      blob( ctx, v.pos.x, v.pos.y, n, true, sampleArray( window.theme.colony.fills ) );
    });
  }
  // Draw blob vertices with stroke and fill
  static drawPolyBlobVerticesFilled( vertices, ctx ) {
    const lepal = window.theme.colony.fills;// ?? [
      // "#bfc5f5ff",
      // "#bff5f0ff",
      // "#f0bff5ff",
      // --
      // "#f0a6ebff",
      // "#aba6f0ff",
      // "#f0aba6ff",
      // --
      // "#f5abc7ff",
      // "#d8abf5ff",
      // "#f5d8abff",
      // --
      // "#d58381ff",
      // "#d581d2ff",
      // "#d2d581ff",
      // -- mothers day
      // "#e16982ff",
      // "#e1c769ff",
      // "#c769e1ff",
      // --- blue,pinky
    //   "#689bdbff",
    //   "#e48eabff",
    //   "#b9dbd8ff",
    // ];
    vertices.forEach(( v, i ) => {
      const n = Math.min( i+2, 8 );
      // blob( ctx, v.pos.x, v.pos.y, 4*n, false );
      blob( ctx, v.pos.x, v.pos.y, 3*n, true, lepal[0] );
      blob( ctx, v.pos.x, v.pos.y, 2*n, true, lepal[1] );
      blob( ctx, v.pos.x, v.pos.y, n, true, lepal[2] );
    });
  }
  // Draw blob vertices with stroke and translucent fill
  static drawPolyBlobVerticesTranslucent( vertices, ctx ) {
    vertices.forEach(( v, i ) => {
      blob( ctx, v.pos.x, v.pos.y, i+1, true, "#00000077" );
    });
  }

  constructor( head, tail, fnShow ) {
    this.vertices = [];
    this.fnShow = fnShow ?? Polyline.drawPolyline;
    head && this.addToHead( head );
    tail && this.addToTail( tail );
  }
  get head() { return this.vertices[0]; }
  get tail() { return this.vertices[ this.vertices.length-1 ]; }

  get x1() { return this.head.pos.x }
  get x2() { return this.tail.pos.x }
  get y1() { return this.head.pos.y }
  get y2() { return this.tail.pos.y }

  addToHead( v ) {
    this.vertices.unshift( v );
  }
  addToTail( v ) {
    this.vertices.push( v );
  }

  addPolylineToHead( p ) {
    this.vertices = [ ...p.vertices.slice( 0, p.vertices.length-1 ), ...this.vertices ];
  }

  addPolylineToTail( p ) {
    this.vertices = [ ...this.vertices, ...p.vertices.slice( 1 ) ];
  }

  reverse() {
    this.vertices.reverse();
  }

  touchesHeadApproximately( pt ) {
    // Naive: Same direction
    if (
      nearEqual( this.x1, pt.x, THRESHOLD ) &&
      nearEqual( this.y1, pt.y, THRESHOLD )
    ) return true;

    return false;
  }
  touchesTailApproximately( pt ) {
    // Naive: Same direction
    if (
      nearEqual( this.x2, pt.x, THRESHOLD ) &&
      nearEqual( this.y2, pt.y, THRESHOLD )
    ) return true;

    return false;
  }
  show( ctx ) {
    this.fnShow( ctx, this.vertices );
  }

  simplify() {

    let keepList = [],
        lastNode;

    const originalLength = this.vertices.length;

    this.vertices.forEach(( v, i ) => {
      if ( i === 0 || lastNode === undefined ) { // same situation but for clarity
        keepList.push( i );
        lastNode = v;
      } else if ( !nearEqual( v.slope, lastNode.slope ) ) {
        // If we turned at after a series, then we need to add the last node.
        if ( !keepList.includes( i-1 ) ) keepList.push( i-1 );

        keepList.push( i );
        lastNode = v;
      }
    });
    // Ensure last node gets added
    if ( !keepList.includes( this.vertices.length-1 ) ) {
      keepList.push( this.vertices.length-1 );
    }

    this.vertices = keepList.map( i => this.vertices[ i ]);

    DEBUG && console.log( `Polyline length: ${originalLength} -> ${this.vertices.length}` );
  }

  inspect() {
    const distinct = ( value, index, self ) => self.indexOf( value ) === index;
    let uniq = this.vertices.filter( distinct );
    let reflection = false;

    if (uniq.length !== this.vertices.length ) {
      reflection = true;
      console.log(">>>>>");
      console.log("Vertices: %d", this.vertices.length)

      this.vertices.forEach(( v, i ) => {
        console.log(`${i}: ${v.pos.x.toFixed(2)}, ${v.pos.y.toFixed(2)}`);
      })
      this.show();
      console.log("<<<<<");
    }
    return reflection;
  }
}