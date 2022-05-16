const RADIAN = Math.PI/180;

class Vector2d {
  constructor( x, y ) {
    this.x = x ?? 0;
    this.y = y ?? 0;
  }
  static add( vec2dA, vec2dB ) {
    return new Vector2d(
      vec2dA.x + vec2dB.x,
      vec2dA.y + vec2dB.y
    );
  }
  static sub( vec2dA, vec2dB ) {
    return new Vector2d(
      vec2dA.x - vec2dB.x,
      vec2dA.y - vec2dB.y
    );
  }
  static mult( vec2d, s ) {
    return vec2d.copy().mult( s );
  }
  static div( vec2d, s ) {
    return vec2d.copy().div( s );
  }
  static dist( vec2dA, vec2dB ) {
    const dx = vec2dB.x - vec2dA.x;
    const dy = vec2dB.y - vec2dA.y;
    return Math.sqrt( dx*dx + dy*dy );
  }
  add( x, y ) {
    // OVERLOAD: Check if x is a Vector2d
    if ( x instanceof Vector2d ) {
      this.x += x.x;
      this.y += x.y;
    } else {
      this.x += x;
      this.y += y;
    }
    return this;
  }
  sub( x, y ) {
    // OVERLOAD: Check if x is a Vector2d
    if ( x instanceof Vector2d ) {
      this.x -= x.x;
      this.y -= x.y;
    } else {
      this.x -= x;
      this.y -= y;
    }
    return this;
  }
  /**
   * 
   * @param {Number} s - Multiplication value
   * @returns Vector2d
   */
  mult( s ) {
    this.x *= s;
    this.y *= s;
    return this;
  }
  /**
   * 
   * @param {Number} s - Divide by s
   * @returns 
   */
  div( s ) {
    this.x /= s;
    this.y /= s;
    return this;
  }
  dist( vec2d ) {
    const dx = vec2d.x - this.x;
    const dy = vec2d.y - this.y;
    return Math.sqrt( dx*dx + dy*dy );
  }
  magnitude() {
    const dx = this.x;
    const dy = this.y;
    return Math.sqrt( dx*dx + dy*dy );
  }
  normalize() {
    const l = this.magnitude();
    this.x /= l;
    this.y /= l;
    return this;
  }
  heading() {
    return Math.atan2( this.y, this.x ) / RADIAN;
  }
  setHeading( deg ) {
    let m = this.magnitude();
    this.x = m * Math.cos( deg * RADIAN );
    this.y = m * Math.sin( deg * RADIAN );
    return this;
  }
  rotate( deg ) {
    const h = this.heading() + deg;
    return this.setHeading( h );
  }
  copy() {
    return new Vector2d( this.x, this.y );
  }
}

export default Vector2d;