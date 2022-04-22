const THRESHOLD = 0.25;
class Polyline {
  static drawingOptions = {
    line: 0x01,
    knuckles: 0x02,
    vertices: 0x04,
    blobVerts: 0x08,
    blobVertsPlus: 0x20,
    blobVertsPlusPlus: 0x40,
    blobVertsTranslucent: 0x10,
    linesAndBlobVerts: 0x01 + 0x08,
    linesAndBlobVertsPlus: 0x01 + 0x20,
    linesAndBlobVertsPlusPlus: 0x01 + 0x40,
  }

  static drawPolyline( vertices ) {
    beginShape();
    vertices.forEach(( v, i ) => {
      vertex( v.pos.x, v.pos.y )
      if ( CONFIG.showVertices ) {
        if ( DEBUG ) {
          circle( v.pos.x, v.pos.y, 2+i )
        } else {
          circle( v.pos.x, v.pos.y, 1 );
        }
      }
    });
    endShape();
  }
  static drawPolylineKnuckles( vertices ) {
    beginShape();
    vertices.forEach(( v, i ) => {
      vertex( v.pos.x, v.pos.y )
      if ( CONFIG.showVertices ) {
        push();
        fill( 0 );
        circle( v.pos.x, v.pos.y, i )
        pop();
      }
    });
    endShape();
  }
  static drawPolyVertices( vertices ) {
    vertices.forEach(( v, i ) => {
      push();
      fill( 0 );
      noStroke();
      circle( v.pos.x, v.pos.y, i )
      pop();
    });
  }
  static drawPolyBlobVertices( vertices ) {
    const blob = ( x, y, r ) => {
      const steps = 12;
      const angleIncrement = 360 / steps;
      let blobPoints = [];
      for ( let n=0; n<steps; n++ ) {
        let angle = n * angleIncrement * Math.PI / 180;
        blobPoints.push({
          x: x + Math.cos( angle ) * ( r + Math.random()*r*0.2 ),
          y: y + Math.sin( angle ) * ( r + Math.random()*r*0.2 )
        });
      }

      beginShape();
      curveVertex( blobPoints[0].x, blobPoints[0].y );
      blobPoints.forEach( b => curveVertex( b.x, b.y ) );
      curveVertex( blobPoints[ blobPoints.length-1 ].x, blobPoints[ blobPoints.length-1 ].y );
      endShape(CLOSE);
    }
    vertices.forEach(( v, i ) => {
      push();
      fill( 0 );
      noStroke();
      blob( v.pos.x, v.pos.y, i+2 );
      pop();
    });
  }
  static drawPolyBlobVerticesPlus( vertices ) {
    const blob = ( x, y, r ) => {
      const steps = 12;
      const angleIncrement = 360 / steps;
      let blobPoints = [];
      for ( let n=0; n<steps; n++ ) {
        let angle = n * angleIncrement * Math.PI / 180;
        blobPoints.push({
          x: x + Math.cos( angle ) * ( r + Math.random()*r*0.2 ),
          y: y + Math.sin( angle ) * ( r + Math.random()*r*0.2 )
        });
      }

      beginShape();
      curveVertex( blobPoints[0].x, blobPoints[0].y );
      blobPoints.forEach( b => curveVertex( b.x, b.y ) );
      // curveVertex( blobPoints[ blobPoints.length-1 ].x, blobPoints[ blobPoints.length-1 ].y );
      curveVertex( blobPoints[0].x, blobPoints[0].y );
      endShape(CLOSE);
    }
    vertices.forEach(( v, i ) => {
      push();
      fill( 0 )
      noStroke();
      blob( v.pos.x, v.pos.y, i+2 );
      if( i % 2 === 0 ) {
        noFill();
        stroke( 0 );
        blob( v.pos.x, v.pos.y, i+5 );
      }
      pop();
    });
  }
  static getControlPoints(x0,y0,x1,y1,x2,y2,t){
    var d01=Math.sqrt(Math.pow(x1-x0,2)+Math.pow(y1-y0,2));
    var d12=Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2));
    var fa=t*d01/(d01+d12);   // scaling factor for triangle Ta
    var fb=t*d12/(d01+d12);   // ditto for Tb, simplifies to fb=t-fa
    var p1x=x1-fa*(x2-x0);    // x2-x0 is the width of triangle T
    var p1y=y1-fa*(y2-y0);    // y2-y0 is the height of T
    var p2x=x1+fb*(x2-x0);
    var p2y=y1+fb*(y2-y0);  
    return [p1x,p1y,p2x,p2y];
}
  static drawPolyBlobVerticesPlusPlus( vertices ) {
    const blob = ( x, y, r, useFill ) => {
      const steps = 6;
      const angleIncrement = 360 / steps;
      let blobPoints = [];
      for ( let n=0; n<steps; n++ ) {
        let angle = n * angleIncrement * Math.PI / 180;
        blobPoints.push({
          x: x + Math.cos( angle ) * ( r + Math.random()*r*0.5 ),
          y: y + Math.sin( angle ) * ( r + Math.random()*r*0.5 )
        });
      }
  
      // Make a copy so we can augment the structure
      let vv = [ ...blobPoints ];
      const last = vv.length-1;
      const closeIt = true;
      const tension = 0.3;
      
      // Do a first past to calculate all of the control points and store them with
      // each vertex for access when drawing.
      vv.forEach(( v, i ) => {
        /**
          Something is janky in this logic that bends the first and last
          vertices in an unexpected way when leaving it open. Fix it :)
        **/
        const v0i = ( i === 0   ) ? ( closeIt ? last : 0  ) : i-1;
        const v2i = ( i === last ) ? ( closeIt ? 0   : last) : i+1; 
        const v0 = vv[ v0i ];
        const v2 = vv[ v2i ];
        
        const t = (( i === 0 || i === last ) && !closeIt ) ? 0 : tension;
        const controls = Polyline.getControlPoints(
          v0.x, v0.y, v.x, v.y, v2.x, v2.y, t
        );
  
        if ( closeIt ) {
          v.cIn = {
            x: controls[ 0 ],
            y: controls[ 1 ]
          };
          v.cOut = {
            x: controls[ 2 ],
            y: controls[ 3 ]
          };
        } else {
          v.cIn = {
            x: ( i === 0 ) ? v.x : controls[ 0 ],
            y: ( i === 0 ) ? v.y : controls[ 1 ]
          };
          v.cOut = {
            x: ( i === last ) ? v.x : controls[ 2 ],
            y: ( i === last ) ? v.y : controls[ 3 ]
          };
        }
      });

      if ( useFill ) {
        noStroke();
        // fill( 0,0,0,50 );
        fill( 0 );
      } else {
        noFill();
        stroke( 0 );
      }

      beginShape();
      vertex( vv[0].x, vv[0].y );
      // Loop through the points and add the curve to the path
      for( let i=1; i < vv.length; i++ ){
        const v0 = vv[ i-1 ];
        const v1 = vv[ i   ];
        bezierVertex( v0.cOut.x, v0.cOut.y, v1.cIn.x, v1.cIn.y, v1.x, v1.y );
      };

      if ( closeIt ) {
        const v0 = vv[ last ];
        const v1 = vv[ 0 ];
        bezierVertex( v0.cOut.x, v0.cOut.y, v1.cIn.x, v1.cIn.y, v1.x, v1.y );
      }
      endShape(); // When using CLOSE, a straight line closes the shape :(
    }
    vertices.forEach(( v, i ) => {
      push();
      blob( v.pos.x, v.pos.y, i+3, true );
      blob( v.pos.x, v.pos.y, 2*(i+3), false );
      pop();
    });
  }
  static drawPolyBlobVerticesTranslucent( vertices ) {
    const blob = ( x, y, r ) => {
      const A = 3;
      const steps = 12;
      const angleIncrement = 360 / steps;
      let blobPoints = [];
      for ( let n=0; n<steps; n++ ) {
        let angle = n * angleIncrement * Math.PI / 180;
        blobPoints.push({
          x: x + Math.cos( angle ) * ( r + Math.random() ),
          y: y + Math.sin( angle ) * ( r + Math.random() )
        });
      }

      beginShape();
      curveVertex( blobPoints[0].x, blobPoints[0].y );
      blobPoints.forEach( b => curveVertex( b.x, b.y ) );
      curveVertex( blobPoints[0].x, blobPoints[0].y );
      curveVertex( blobPoints[1].x, blobPoints[1].y );
      endShape(CLOSE);
    }
    vertices.forEach(( v, i ) => {
      push();
      fill( 0,0,0, 128 );
      noStroke();
      blob( v.pos.x, v.pos.y, i+1 );
      pop();
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
  show() {
    DEBUG && stroke( Math.random() * 255, Math.random() * 255, Math.random() * 255 );
    // DEBUG && this.vertices.forEach(( v, i ) => circle( v.pos.x, v.pos.y, 1+i ));

    this.fnShow( this.vertices );
    // Polyline.drawPolyline( this.vertices );
    // Polyline.drawPolylineKnuckles( this.vertices );
    // Polyline.drawPolyVertices( this.vertices );
    // Polyline.drawPolyBlobVertices( this.vertices );

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