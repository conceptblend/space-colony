import { nearEqual } from "./utils.js";

export default class Segment {
  constructor( head, tail, colour = [0,0,0] ) {
    this.head = head;
    this.tail = tail;
    this.c = colour;
    this.visited = false;
  }
  get x1() { return this.head.pos.x }
  get x2() { return this.tail.pos.x }
  get y1() { return this.head.pos.y }
  get y2() { return this.tail.pos.y }
  
  get slope() { return (this.y2 - this.y1 ) / ( this.x2 - this.x1 ) }

  overlapsApproximately( s ) {
    // Naive: Same direction
    if (
      nearEqual( this.x1, s.x1 ) &&
      nearEqual( this.y1, s.y1 ) &&
      nearEqual( this.x2, s.x2 ) &&
      nearEqual( this.y2, s.y2 )
    ) return true;

    // Naive: Reversed direction
    if (
      nearEqual( this.x1, s.x2 ) &&
      nearEqual( this.y1, s.y2 ) &&
      nearEqual( this.x2, s.x1 ) &&
      nearEqual( this.y2, s.y1 )
    ) return true;
    
    return false;
  }
  touchesHeadApproximately( pt ) {
    // Naive: Same direction
    if (
      nearEqual( this.x1, pt.x ) &&
      nearEqual( this.y1, pt.y )
    ) return true;
    
    return false;
  }
  touchesTailApproximately( pt ) {
    // Naive: Same direction
    if (
      nearEqual( this.x2, pt.x ) &&
      nearEqual( this.y2, pt.y )
    ) return true;
    
    return false;
  }
  show( ctx ) {
    ctx.line( this.x1, this.y1, this.x2, this.y2 );
  }
}