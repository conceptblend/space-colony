export default class FluidDistortion {
  constructor( options ) {
    this.directions = [];
    this.magnitudes = [];
    this.cols = options?.cols ?? 20;
    this.rows = options?.rows ?? this.cols;
    this.k = options?.k ?? 0.0017;

    this.setup();
  }

  setup() {
    let zOff1 = Math.random() * Math.pow(2, 16);
    let zOff2 = Math.random() * Math.pow(2, 16) + Math.pow(2, 16);

    // TODO: Replace after p5.js is removed
    for( let y = 0; y < this.rows; y++ ) {
      for( let x = 0; x < this.cols; x++ ) {
        let i = x + y * this.cols,
            xk = x * this.k,
            yk = y * this.k;
        this.directions[ i ] = noise.perlin3( xk, yk, zOff1 );
        this.magnitudes[ i ] = noise.perlin3( xk * 10, yk * 10, zOff2 );
      }
    }
  }

  /**
   * 
   * @param {Number} x Column index of grid
   * @param {Number} y Row index of grid
   * @returns Stored direction for the corresponding row x col position.
   */
  getDirection( x, y ) {
    // Throw an error if the coords are out of range
    //if ( x < 0 || x >= this.cols || y < 0 || y >= this.rows ) throw new Error(`FluidDistortion.getDirection( ${x}, ${y} ) coordinates out of range.`)

    // Clamp it instead
    x = Math.max( Math.min( x, this.cols ), 0 );
    y = Math.max( Math.min( y, this.rows ), 0 );

    return this.directions[ x + y * this.cols ];
  };

  /**
   * 
   * @param {Number} x 0..1
   * @param {Number} y 0..1
   * @returns {Number} Stored magnitude for the corresponding row x col position for normalized range.
   */
  getDirectionFromNormalized( x, y ) {
      return this.getDirection( Math.floor( x * this.cols), Math.floor( y * this.rows ));
  }

  /**
   * 
   * @param {Number} x Column index of grid
   * @param {Number} y Row index of grid
   * @returns Stored magnitude for the corresponding row x col position.
   */
  getMagnitude( x, y ) {
    // Throw an error if the coords are out of range
    // if ( x < 0 || x >= this.cols || y < 0 || y >= this.rows ) throw new Error(`FluidDistortion.getMagnitude( ${x}, ${y} ) coordinates out of range.`)
    // Clamp it instead
    x = Math.max( Math.min( x, this.cols ), 0 );
    y = Math.max( Math.min( y, this.rows ), 0 );

    return this.magnitudes[ x + y * this.cols ];
  }

  /**
   * 
   * @param {Number} x 0..1
   * @param {Number} y 0..1
   * @returns {Number} Stored magnitude for the corresponding row x col position for normalized range.
   */
  getMagnitudeFromNormalized( x, y ) {
    return this.getMagnitude( Math.floor( x * this.cols), Math.floor( y * this.rows ));
  }
}