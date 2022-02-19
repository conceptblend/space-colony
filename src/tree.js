// Dramatically modified but inspired by Daniel Shiffman
// Code for: https://youtu.be/kKT0v3qhIQY

const DEBUG = !true;
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

  get MAXDIST_3() { return this.maxDist * 3.0 };
  get MAXDIST_3over2() { return this.MAXDIST_3 * 0.5 }

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

    if ( this.leaves.length === 0 ) {
      // Create some leaves
      let weight = 0;

      for (let i = 0, len = this.numLeaves; i < len; i++) {
        weight = Math.ceil( Math.random() * 10 );
        // Skip if the leaf/attractor would be inside the circle
        let x = Math.floor( Math.random() * nw );
        let y = Math.floor( Math.random() * nh );
        // let xr = x - nw/2;
        // let yr = y - nh/2;
        let sdfContainer = 1;//Math.sign(4*offset - Math.sqrt(xr * xr + yr * yr));
        // let sdfBite = 1.0;// Math.sign(Math.sqrt(xr * xr + yr * yr) - 2*offset);
        // if (sdfContainer > 0 && sdfBite > 0) {
        if ( sdfContainer > 0 ) {
          this.leaves.push(new Leaf(
            createVector(offset + x, offset + y),
            weight // weight
          ));
        }
      }
    }
    
    // Set up the trunk/root
    let pos = createVector(offset + Math.floor(Math.random()*nw), offset + Math.floor(Math.random()*nh) );
    let dir = p5.Vector.sub( createVector( this.width*0.5, this.height*0.5 ), pos ).normalize();
    let root = new Branch(null, pos, dir, this.branchLength);

    this.qt.insert(root);

    let current = root;
    let found = false;

    while (!found) {
      this.leaves.forEach(leaf => {
        let d = p5.Vector.dist(current.pos, leaf.pos);
        if (d < this.maxDist) {
          found = true;
        }
      });
      if (!found) {
        let branch = current.next();
        current = branch;
        this.qt.insert(current);
      }
    }
  }

  grow() {

    this.leaves.forEach(leaf => {
      let closestBranch = null;
      let record = this.maxDist;
      
      // ** DISRUPT THE LEAFS/FOODSOURCE
      if ( this.distortion !== Tree.distortionOptions.NONE ) {
        switch ( this.distortion ) {
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
      }
      // **/

      let branches = this.qt.query(
        new Rect(
          leaf.pos.x - this.MAXDIST_3over2,
          leaf.pos.y - this.MAXDIST_3over2,
          this.MAXDIST_3,
          this.MAXDIST_3
        )
      );

      branches.forEach(branch => {
        if (leaf.reached) return;
        let d = p5.Vector.dist(leaf.pos, branch.pos);
        if (d < this.minDist) {
          leaf.reached = true;
          closestBranch = null;
        } else if (d < record) {
          closestBranch = branch;
          record = d;
        }
      });

      if (closestBranch != null) {
        let newDir = p5.Vector.sub(leaf.pos, closestBranch.pos);
        closestBranch.dir.add(newDir.mult(leaf.weight).normalize());
        closestBranch.count++;
      }
    });

    // Clean up dead leaves
    for (let i = this.leaves.length - 1; i >= 0; i--) {
      if (this.leaves[i].reached) {
        this.leaves.splice(i, 1);
      }
    }

    //
    // How can I traverse the whole list if it's in a QuadTree?
    //
    let branches = this.qt.flatten();
    let branch;
    for (let i = branches.length - 1; i >= 0; i--) {
      branch = branches[i];
      if (branch.count > 0) {
        /* Average the directions based on the attractors applied */
        // branch.dir.div(branch.count + 1);
        /* Or, normalize and scale by fun numbers! */
        branch.dir.normalize().mult(2.7); // 1.7, 2.7
        
        //
        // -> Relies on `angleMode(DEGREES)`
        // Adds gentle wobble or squiggle to the paths.
        // branch.dir.rotate(random(-15, 15));

        let theta;
        switch ( this.steering ) {
          case Tree.steeringOptions.LEFT_ROUNDING:
            /* OR, Round to the nearest N degrees and force left-hand turns */
            theta = Math.floor(branch.dir.heading() / this.angle) * this.angle;
            break;
          case Tree.steeringOptions.RIGHT_ROUNDING:
            // OR, Round to the nearest N degrees and force right-hand turns
            theta = Math.ceil(branch.dir.heading() / this.angle) * this.angle;
            break;
          case Tree.steeringOptions.ROUNDING:
            /* OR, Round to the nearest N degrees */
            theta = Math.round(branch.dir.heading() / this.angle) * this.angle;
            break;
          case Tree.steeringOptions.NONE:
          default:
            break;
        }
        
        if ( theta !== undefined ) {
          branch.dir.rotate(theta - branch.dir.heading());
        }
        
        // console.log(theta);
        this.qt.insert(branch.next());
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
    
    branches.forEach(branch => branch.show());
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
    
    let trimmed = this._dedupe(branches);
    /*DEBUG &&*/ console.log(`Trimmed: ${trimmed.length}`);
    
    let segments = this.createSegments( trimmed );
    /*DEBUG &&*/ console.log(`Segments: ${segments.length}`);

    const MAX_PASSES = 10;
    let passCount = 0;
    let lastSegmentCount = 0;
    
    do {
      lastSegmentCount = segments.length;
      passCount++;

      /*DEBUG && */ console.log(`Begin pass ${passCount}`);

      segments = this._simplify( segments );

      /*DEBUG && */ console.log(`Simplified segments (Pass ${passCount}): ${segments.length}`);
    } while ( lastSegmentCount !== segments.length && passCount < MAX_PASSES);

    segments.forEach(s => {
      DEBUG && stroke( s.c );
      // TODO: Find a way to call the stored `branch.show` method instead of
      // manually recreating it.
      line( s.x1, s.y1, s.x2, s.y2 );
    });
  }
  
  _dedupe( t ) {
    let visitedHash = {};
    let trimmed = t.filter((branch) => {
      if (branch.parent === null) return true;

      let h = '';
      
      /***
       *  WARNING
       *  Applying `parseInt` to simplify hashes is probably removing nodes we actually want...
       ***/
      if (branch.pos.x < branch.parent.pos.x) {
        h = `h${parseInt(branch.pos.x)}${parseInt(branch.pos.y)}${parseInt(branch.parent.pos.x)}${parseInt(branch.parent.pos.y)}`;
      } else { //if (branch.pos.x > branch.parent.pos.x) {
        h = `h${parseInt(branch.parent.pos.x)}${parseInt(branch.parent.pos.y)}${parseInt(branch.pos.x)}${parseInt(branch.pos.y)}`;
      }

      if (visitedHash.hasOwnProperty(h)) return false;

      visitedHash[h] = true;
      return true;
    });

    return trimmed;
  }


  createSegments( t ) {
    let branches = [...t];
    let segments = [];
    // Create all of the line segments and set the up to
    // prefer Left-to-Right; and when both X coords are the same,
    // prefer Top-to-Bottom.
    branches.forEach((branch) => {
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
  
  _simplify( t ) {

    let segments_raw = [...t];
    let segments_optimized = [];

    segments_raw.forEach(raw => {
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
  const delta = deltaOverride ?? 0.05; // 0r 0.025?
  return Math.abs(b - a) < delta;
}