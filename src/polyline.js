const THRESHOLD = 0.25;
class Polyline {

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
      endShape();
    }
    vertices.forEach(( v, i ) => {
      push();
      fill( 0 );
      noStroke();
      blob( v.pos.x, v.pos.y, i+1 );
      pop();
    });
  }

  constructor( head, tail, colour ) {
    this.c = colour ?? [0,0,0];
    this.vertices = [];
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
    
    Polyline.drawPolyline( this.vertices );
    // Polyline.drawPolylineKnuckles( this.vertices );
    // Polyline.drawPolyVertices( this.vertices );
    Polyline.drawPolyBlobVertices( this.vertices );

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