// Dramatically modified but inspired by Daniel Shiffman
// Code for: https://youtu.be/kKT0v3qhIQY

class Tree {
  static steeringOptions = {
    NONE: 0x01,
    ROUNDING: 0x02,
    LEFT_ROUNDING: 0x03,
    RIGHT_ROUNDING: 0x04,
  };

  static distortionOptions = {
    NONE: 1,
    SINWAVE1: 2,
    SINWAVE2: 3,
    SINWAVE3: 4,
    WARP: 5,
    FLOW: 6,
  };

  constructor( options ) {
    this.angle = options?.angle ?? 120;
    this.branchLength = options?.branchLength ?? 4;
    this.height = options?.height ?? 400;
    this.numLeaves = options?.numLeaves ?? 500;
    this.maxDist = options?.maxDist ?? 96;
    this.minDist = options?.minDist ?? 24;
    this.width = options?.width ?? 400;
    this.steering = options?.steering ?? Tree.steeringOptions.LEFT_ROUNDING;
    this.seed = options?.seed ?? Math.random() * 512;

    this.MAXDIST_DIAMETER = this.maxDist * 2.25;
    this.MAXDIST_RADIUS = this.MAXDIST_DIAMETER * 0.5;

    this.distortion = options?.distortion ?? Tree.distortionOptions.NONE; //Tree.distortionOptions.WARP;
    this.fluidDistortion = (this.distortion === Tree.distortionOptions.FLOW) ? ( options?.fluidDistortion ?? new FluidDistortion({
      cols: 40,
      rows: 40,
      k: 0.00085,
    }) ) : null;

    this.qt = new QuadTree(new Rect(0, 0, this.width, this.height), 4);
    this.leaves = options?.leaves ?? [];

    this.setup();
  }

  setup() {
    let offset = this.width * 0.1;
    let nw = this.width - 2 * offset;
    let nh = this.height - 2 * offset;

    // If there are no leaves provided, lets create some
    if ( this.leaves.length === 0 ) {
      for (let i = 0, len = this.numLeaves; i < len; i++) {
        // Skip if the leaf/attractor would be inside the circle
        let x = Math.floor( Math.random() * nw );
        let y = Math.floor( Math.random() * nh );
        this.leaves.push(new Leaf(
          createVector(offset + x, offset + y)
        ));
      }
    }
    
    // Set up the trunk/root
    let pos = createVector(offset + Math.floor(Math.random()*nw), offset + Math.floor(Math.random()*nh) );
    let dir = p5.Vector.sub( createVector( this.width*0.5, this.height*0.5 ), pos ).normalize();
    let root = new Branch(null, pos, dir, this.branchLength);

    this.qt.insert(root);

    let current = root;
    let found = false;

    while ( !found ) {
      this.leaves.forEach(leaf => {
        let d = p5.Vector.dist(current.pos, leaf.pos);
        if (d < this.maxDist) {
          found = true;
        }
      });
      if ( !found ) {
        let branch = current.next();
        current = branch;
        this.qt.insert( current );
      }
    }
  }

  grow() {
    /**
     * TODO: Fix? This feels like it would be optimal to loop the branches in
     * order to measure... but the leaves would still need to move AND the I
     * need to remember that we're finding the closest branch. I think this
     * might be a bad idea but will re-evaluate later.
     */

    this.leaves.forEach(leaf => {
      let closestBranch = null;
      let record = this.maxDist;
      
      // DISRUPT THE LEAFS/FOODSOURCE
      switch ( this.distortion ) {
        case Tree.distortionOptions.NONE:
          break;
        case Tree.distortionOptions.SINWAVE1:
          leaf.pos.add(sin(0.5*leaf.pos.y), 0);
          break;
        case Tree.distortionOptions.SINWAVE2:
          leaf.pos.add(sin(2*leaf.pos.y), 0);
          break;
        case Tree.distortionOptions.SINWAVE3:
          leaf.pos.add(2*sin(4*leaf.pos.y), 0);
          break;
        case Tree.distortionOptions.WARP:
          leaf.pos.add(sin(leaf.pos.y + this.seed), (0.5 + 0.5*cos(leaf.pos.x  + this.seed)) * 2);
          break;
        case Tree.distortionOptions.FLOW:
          let xw = leaf.pos.x / width,
              yh = leaf.pos.y / height;
          let dir = this.fluidDistortion.getDirectionFromNormalized( xw, yh ) * 360;
          let mag = this.fluidDistortion.getMagnitudeFromNormalized( xw, yh ) * 10;
          leaf.pos.add( mag * Math.cos( dir ), mag * Math.sin( dir ) );
          break;
      }

      // Look up all of the branches within range
      let branches = this.qt.query(
        new Rect(
          leaf.pos.x - this.MAXDIST_RADIUS,
          leaf.pos.y - this.MAXDIST_RADIUS,
          this.MAXDIST_DIAMETER,
          this.MAXDIST_DIAMETER
        )
      );

      // Find the closest branch to this leaf
      let nn = branches.length;
      let d = 0, branch;
      for ( let pp = 0; pp < nn; pp++ ) {
        branch = branches[ pp ];
        d = leaf.pos.dist( branch.pos );
        if (d < this.minDist) {
          leaf.reached = true;
          closestBranch = null;
          break;
        } else if (d < record) {
          closestBranch = branch;
          record = d;
        }
      };

      // if we found a leaf, add a force to its direction
      if (closestBranch !== null) {
        let newDir = p5.Vector.sub(leaf.pos, closestBranch.pos);
        closestBranch.dir.add( newDir.mult(leaf.weight).normalize() );
        closestBranch.count++;
      }
    }); // End leaf loop

    //
    // Clean up dead leaves
    //
    // for (let i = this.leaves.length - 1; i >= 0; i--) {
    //   this.leaves[i].reached && this.leaves.splice(i, 1);
    // }
    this.leaves = this.leaves.filter( l => l.reached === false );

    //
    // How can I traverse the whole list if it's in a QuadTree?
    //
    let branches = this.qt.flatten();
    let branch;
    for (let i = branches.length - 1; i >= 0; i--) {
      branch = branches[ i ];
      if (branch.count > 0) {
        /* Average the directions based on the attractors applied */
        // branch.dir.div(branch.count + 1);
        /* Or, normalize and scale by fun numbers! */
        branch.dir.normalize().mult(2.7); // 1.7, 2.7
        
        //
        // -> Relies on `angleMode(DEGREES)`
        // Adds gentle wobble or squiggle to the paths.
        // branch.dir.rotate(random(-15, 15));

        let theta,
            alpha = branch.dir.heading();
        switch ( this.steering ) {
          case Tree.steeringOptions.LEFT_ROUNDING:
            /* OR, Round to the nearest N degrees and force left-hand turns */
            theta = Math.floor( alpha / this.angle ) * this.angle;
            break;
          case Tree.steeringOptions.RIGHT_ROUNDING:
            // OR, Round to the nearest N degrees and force right-hand turns
            theta = Math.ceil( alpha / this.angle ) * this.angle;
            break;
          case Tree.steeringOptions.ROUNDING:
            /* OR, Round to the nearest N degrees */
            theta = Math.round( alpha / this.angle ) * this.angle;
            break;
          case Tree.steeringOptions.NONE:
          default:
            break;
        }
        
        if ( theta !== undefined ) {
          branch.dir.rotate( theta - alpha );
        }
        
        this.qt.insert( branch.next() );
        branch.reset();
      }
    }
  }
  
  flatten() {    
    return this.qt.flatten();
  }
  
  show() {
    // this.leaves.forEach(leaf => leaf.show());
    let branches = this.qt.flatten();
    
    branches.forEach( branch => branch.show() );
  }
  
  /**
   * Experimental algorithm for climbing "up" the tree to remove
   * duplicate (overlapping) branches and to make the longest possible line.
   * --
   * Naively stash found segments based on a hash of the start and end points.
   **/
  joinAndShow() {
    let branches = this.qt.flatten();
    /*DEBUG &&*/ console.log(`Full: ${branches.length}`);
    
    let trimmed = this.dedupe(branches);
    /*DEBUG &&*/ console.log(`Trimmed: ${trimmed.length}`);

    const randoDraw = t => {
      // stroke( Math.random() * 255, Math.random() * 255, Math.random() * 255, 64 );
      stroke( 0, 0, 0, 64 );
      t.show()
    }

    // trimmed.forEach( randoDraw );

    
    // let segments = this.createSegments( trimmed );
    // /*DEBUG &&*/ console.log(`Segments: ${segments.length}`);

    // const MAX_PASSES = 10;
    // let passCount = 0;
    // let lastSegmentCount = 0;
    
    // do {
    //   lastSegmentCount = segments.length;
    //   passCount++;

    //   /*DEBUG && */ console.log(`Begin pass ${passCount}`);

    //   segments = this.simplify( segments );

    //   /*DEBUG && */ console.log(`Simplified segments (Pass ${passCount}): ${segments.length}`);
    // } while ( lastSegmentCount !== segments.length && passCount < MAX_PASSES);

    // segments.forEach(s => {
    //   DEBUG && stroke( s.c );
    //   // TODO: Find a way to call the stored `branch.show` method instead of
    //   // manually recreating it.
    //   stroke( Math.random() * 255, Math.random() * 255, Math.random() * 255 );
    //   line( s.x1, s.y1, s.x2, s.y2 );
    // });


    // %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
    // %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

    /**
     * Reverse walk up the tree and try to make longer branches
     */

     let leafNodes = trimmed.filter( b => b.isLeaf );
     // let leafNodes = branches.filter( b => b.isLeaf );
 
     // leafNodes.forEach( randoDraw );
 
     let polylines = [];
 
     leafNodes.forEach( l => {
       const poly = new Polyline();
       let node = l;
  
       // To rejoin with an existing path, allow the first `visited` node to
       // be added then abort.
       let abort = false;
       while ( node !== null && !abort ) {
         abort = ( node.visited === true );
         poly.addToHead( node );
         node.visited = true;
         node = node.parent;
       }
 
       polylines.push( poly );
     });

    //  polylines.forEach( p => p.simplify() )
 
     polylines.forEach( randoDraw );
 
 
     // %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
     // %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  }
  
  dedupe( t ) {
    let visitedHash = {};
    let trimmed = t.filter( branch => {
      if (branch.parent === null) return true;

      let h = '';
      
      /**
       * Create a hash entry representing the segment and only add uniques.
       **/
      const PRECISION = 1;
      if (branch.pos.x < branch.parent.pos.x) {
        h = `h${ branch.pos.x.toFixed(PRECISION) }${ branch.pos.y.toFixed(PRECISION) }${ branch.parent.pos.x.toFixed(PRECISION) }${ branch.parent.pos.y.toFixed(PRECISION) }`;
      } else { //if (branch.pos.x > branch.parent.pos.x) {
        h = `h${ branch.parent.pos.x.toFixed(PRECISION) }${ branch.parent.pos.y.toFixed(PRECISION) }${ branch.pos.x.toFixed(PRECISION) }${ branch.pos.y.toFixed(PRECISION) }`;
      }

      if ( visitedHash.hasOwnProperty( h ) ) return false;

      visitedHash[h] = true;
      return true;
    });

    return trimmed;
  }


  createSegments( t ) {
    // let branches = [...t]; // why a copy?
    let segments = [];
    /**
     * Create all of the line segments and set the up to prefer Left-to-Right;
     * and when both X coords are the same, prefer Top-to-Bottom.
     **/
    t.forEach( branch => {
      let p = branch.parent;
      if (p === null) return;
      
      let s;
      if ( nearEqual( branch.pos.x, p.pos.x ) ) {
        if ( branch.pos.y < p.pos.y ) {
          s = new Segment( branch, p, [255,0,0, 64] /* FOR DEBUGGING */ );
        } else {
          s = new Segment( p, branch, [255,0,0, 64] /* FOR DEBUGGING */ );
        }
      } else if ( nearEqual( branch.pos.y, p.pos.y ) ) {
        if ( branch.pos.x < p.pos.x ) {
          s = new Segment( branch, p, [0,0,0, 64] /* FOR DEBUGGING */ );
        } else {
          s = new Segment( p, branch, [0,0,0, 64] /* FOR DEBUGGING */ );
        }
      } else {
        s = new Segment( branch, p, [0,0,255, 64] /* FOR DEBUGGING */ );
      }
      segments.push( s );
    });
    return segments;
  }

  
  simplify( t ) {

    // let segments_raw = [...t]; // why copy?
    let segments_optimized = [];

    t.forEach(raw => {
      // See if we can extend an existing segment
      
      // Find same slope
      let matches = segments_optimized.filter(opti => {
        // Use `nearEqual` because floating point rounding does some awkward shit :/
        return nearEqual( raw.slope, opti.slope );
      });
      
      // console.log("Matches: ", matches.length);
      
      if ( matches.length === 0 ) {
        segments_optimized.push( raw );
      } else {
        /**
         * Now compare against all of the segments matched with the same slope.
         * Depending on which end-points are touching, extend the ?? matched segment ??.
         * For some reason, this isn't working on vertical lines.
         */
        let found = false;
        matches.forEach(m => {
          if ( found ) return;
          
          if ( nearEqual( raw.x1, m.x2 ) && nearEqual( raw.y1, m.y2 ) ) {
            // Extend the optimized segment "BEFORE"
            m.tail = raw.tail;
            found = true;
          } else if ( nearEqual( raw.x2, m.x1 ) && nearEqual( raw.y2, m.y1 ) ) {
            // Extend the optimized segment "AFTER"
            m.head = raw.head;
            found = true;
          }
        });
        if ( !found ) {
          // NO MATCH so we need to move it in
          segments_optimized.push( raw );
        }
      }
    });

    // End joining of slope friends
    // %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
    // Begin linking and optimization of branches
    // TODO

    return segments_optimized;
  }

  currentConfig() {
    return {
      angle: this.angle,
      branchLength: this.branchLength,
      canvasSize: this.width === this.height ? this.width : -1,
      height: this.height,
      attractors: this.numLeaves,
      numLeaves: this.numLeaves,
      maxDist: this.maxDist,
      minDist: this.minDist,
      width: this.width,
      steering: this.steering,
      distortion: this.distortion,
      fluidDistortion: this.fluidDistortion ? {
        cols: this.fluidDistortion.cols,
        rows: this.fluidDistortion.rows,
        k: this.fluidDistortion.k
      } : null
    }
  }
}

/**
 * return TRUE if a is within delta of b
 * return FALSE otherwise
 **/
function nearEqual( a, b, deltaOverride ) {
  if (a === Infinity && b === Infinity ) return true;
  if (a === -Infinity && b === -Infinity ) return true;
  const delta = deltaOverride ?? 0.025; // ≥ 0.05 introduces loss
  return Math.abs(b - a) < delta;
}