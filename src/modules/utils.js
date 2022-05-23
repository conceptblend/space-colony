/**
 * return TRUE if a is within delta of b
 * return FALSE otherwise
 **/
 export function nearEqual( a, b, deltaOverride ) {
  if (a === Infinity && b === Infinity ) return true;
  if (a === -Infinity && b === -Infinity ) return true;
  const delta = deltaOverride ?? 0.025; // ≥ 0.05 introduces loss
  return Math.abs(b - a) < delta;
}

/**
 * SDFs
 */

export const sdfCircle = ( x, y, cx, cy, r ) => {
  const dx = x - cx;
  const dy = y - cy;

  return r - Math.sqrt( dx * dx + dy * dy );
}

export const sdfEquiTriangle = ( x, y, cx, cy, r ) => {
  const k = Math.sqrt(3.0);
  // p.x = abs(p.x) - 1.0;
  const dx = Math.abs( x - cx ) - r;

  // p.y = p.y + 1.0/k;
  const dy = ( y + 1.4*r/k ) - cy;

  let nx = dx, ny = dy;
  
  // if( p.x+k*p.y>0.0 ) p = vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;
  if( dx + k * dy > 0.0 ) {
    nx = ( dx - k * dy ) / 2.0;
    ny = ( -k * dx - dy ) / 2.0;
  }

  nx -= Math.min( Math.max( nx, -2.0 * r), 0.0 ); // clamp -2..0
  return Math.sqrt( nx * nx + ny * ny ) * Math.sign(ny);
}

// r=radius, h=height
export const sdfCutDisk = ( x, y, cx, cy, r, h ) => {
  // Modified from Inigo Quilez: https://www.shadertoy.com/view/ftVXRc

  const w = Math.sqrt( r*r - h*h ); // constant for a given shape

  const dx = Math.abs( x - cx );
  const dy = cy - y; // inverted to create a bush

  // select circle or segment
  const s = Math.max( ( h-r )* dx * dx + w * w * ( h + r - 2.0 * dy ), h * dx - w * dy );

  const dx2 = dx - w;
  const dy2 = dy - h;

  return -1 * ( (s < 0.0) ? Math.sqrt( dx*dx + dy*dy ) - r :        // circle
          (dx < w) ? h - dy     :        // segment line
          Math.sqrt( dx2*dx2 + dy2*dy2 )); // segment corner
}

export const sdfHeart = ( x, y, cx, cy, _scale ) => {
  // For the constants in this SDF to work, I believe (x,y) need to be
  // normalized from 0..1.
  let scale = _scale * 0.75;
  // Normalize and reflect
  const dx = Math.abs( x - cx ) / scale;
  // Normalize and translate
  const dy = 0.25 + 1.0 - ( y / scale );
  
  let dd, nx, ny;

  if ( dy + dx > 1.0 ) {
    nx = dx - 0.25;
    ny = dy - 0.75;

    dd = Math.sqrt( nx * nx + ny * ny ) - (Math.SQRT2 / 4.0);
  } else {
    let n1 = {
      x: dx,
      y: dy - 1.0
    }
    let sub = 0.5 * Math.max( dx + dy, 0 );
    let n2 = {
      x: dx - sub,
      y: dy - sub
    }

    let d1 = n1.x * n1.x + n1.y * n1.y;
    let d2 = n2.x * n2.x + n2.y * n2.y;
    
    dd = Math.sqrt( Math.min( d1, d2 ) ) * Math.sign( dx - dy );
  }
  return -dd;
}