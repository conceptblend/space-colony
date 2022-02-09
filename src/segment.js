class Segment {
  constructor( head, tail, colour = [0,0,0] ) {
    this.head = head;
    this.tail = tail;
    this.c = colour;
  }
  get x1() { return this.head.pos.x }
  get x2() { return this.tail.pos.x }
  get y1() { return this.head.pos.y }
  get y2() { return this.tail.pos.y }
  
  get slope() { return (this.y2 - this.y1 ) / ( this.x2 - this.x1 ) }
}