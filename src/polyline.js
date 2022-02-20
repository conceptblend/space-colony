class Polyline {
  constructor( head, tail, colour ) {
    // this.head = head;
    // this.tail = tail;
    this.c = colour ?? [0,0,0];
    this.vertices = [];
    head && this.addToHead( head );
    tail && this.addToTail( tail );
  }
  addToHead( v ) {
    this.vertices.unshift( v );
  }
  addToTail( v ) {
    this.vertices.push( v );
  }
  show() {
    if ( DEBUG && this.vertices.length < 3 ) stroke( "#F802C1" );
    beginShape();
    this.vertices.forEach(( v, i ) => {
      vertex( v.pos.x, v.pos.y )
      if ( DEBUG ) {
        if ( i === 0 ){ 
          circle( v.pos.x, v.pos.y, 4 );
        } else {
          circle( v.pos.x, v.pos.y, 1 );
        }
      }
    });
    endShape();
  }
  get head() { return this.vertices[0]; }
  get tail() { return this.vertices[ this.vertices.length-1 ]; }

  get x1() { return this.head.pos.x }
  get x2() { return this.tail.pos.x }
  get y1() { return this.head.pos.y }
  get y2() { return this.tail.pos.y }
  
  // get slope() { return (this.y2 - this.y1 ) / ( this.x2 - this.x1 ) }

  simplify() {

    let keepList = [],
        lastNode;

    this.vertices.forEach(( v, i ) => {
      if ( i === 0 || lastNode === undefined ) { // same situation but for clarity
        keepList.push( i );
        lastNode = v;
      } else if ( !nearEqual( v.slope , lastNode.slope ) ) {
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
  }
}