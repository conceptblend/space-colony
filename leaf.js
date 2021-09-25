// Coding Rainbow
// Daniel Shiffman
// http://patreon.com/codingtrain
// Code for: https://youtu.be/kKT0v3qhIQY

function Leaf(w, pos) {
  // this.pos = createVector(10*round(random(width)/10), random(height));
  // this.pos = createVector(random(width), random(height) * 0.74);
  // this.pos = createVector(random(width), random(height));
  
  let offset = width / 10;
  // this.pos = createVector(offset + 5*round(random(width-2*offset)/5), offset + random(height - 2 * offset));
  this.pos = pos || createVector(offset + floor(random(width-2*offset)), offset + floor(random(height - 2 * offset)));
  this.weight = w || 1.0;
  
  this.reached = false;

  this.show = function() {
    stroke(0, 14, 32);
    noFill();
    let r = this.weight/100;
    circle(this.pos.x, this.pos.y, r);
  }
}
