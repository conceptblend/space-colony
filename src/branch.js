// Coding Rainbow
// Daniel Shiffman
// http://patreon.com/codingtrain
// Code for: https://youtu.be/kKT0v3qhIQY

class Branch {
  constructor( parent, pos, dir, length = 4 ) {
    this.pos = pos;
    this.parent = parent;
    this.dir = dir;
    this.origDir = this.dir.copy();
    this.count = 0;
    this.len = length; // TODO: Expose this as a param and use it to vary the config
  }
  
  reset() {
    this.dir = this.origDir.copy();
    this.count = 0;
  }
  
  overlapsExactly( b ) {
    
    if (this.parent === null || b.parent === null) {
      // Test if they're both the root node
      // Shortcut: If the parent is not defined, assume it's the root
      if (this.parent === null && b.parent === null &&
          this.pos == b.pos ) return true;

      return false;
    }
    
    // Naive: Same direction
    if (this.pos == b.pos && this.parent.pos == b.parent.pos) return true;
    // Naive: Reversed direction
    if (this.pos == b.parent.pos && this.parent.pos == b.pos) return true;
    
    return false;
  }

  next() {
    var nextDir = p5.Vector.mult(this.dir, this.len);
    var nextPos = p5.Vector.add(this.pos, nextDir);
    var nextBranch = new Branch(this, nextPos, this.dir.copy(), this.len);
    return nextBranch;
  }

  show() {
    if ( this.parent !== null ) {
      line(this.pos.x, this.pos.y, this.parent.pos.x, this.parent.pos.y);
    }
  }
}
