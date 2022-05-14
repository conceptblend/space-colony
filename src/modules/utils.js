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