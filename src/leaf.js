// Coding Rainbow
// Daniel Shiffman
// http://patreon.com/codingtrain
// Code for: https://youtu.be/kKT0v3qhIQY

class Leaf {
  constructor( pos, weight ) {
    if ( undefined === pos ) throw new Error("Leaf constructor requires a `pos` argument.");

    this.pos = pos;
    this.weight = weight ?? 1.0;
    this.reached = false;
  }

  show() {
    push();
    stroke( 0 );
    noFill();
    circle( this.pos.x, this.pos.y, 3 );
    pop();
  }
}
