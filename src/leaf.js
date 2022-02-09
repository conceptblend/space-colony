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
    stroke(0, 14, 32);
    noFill();
    circle( this.pos.x, this.pos.y, this.weight * 0.01 );
  }
}
