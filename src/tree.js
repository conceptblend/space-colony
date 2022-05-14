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
    this.numAttractors = options?.numAttractors ?? 500;
    this.numRoots = options.numRoots ?? 1;
    this.maxDist = options?.maxDist ?? 96;
    this.minDist = options?.minDist ?? 24;
    this.width = options?.width ?? 400;
    this.steering = options?.steering ?? Tree.steeringOptions.LEFT_ROUNDING;
    this.seed = options?.seed ?? Math.random() * 512;
    this.fnShow = options?.fnShow ?? Polyline.drawPolyline;

    this.MAXDIST_DIAMETER = this.maxDist * 2.25;
    this.MAXDIST_RADIUS = this.MAXDIST_DIAMETER * 0.5;

    this.distortion = options?.distortion ?? Tree.distortionOptions.NONE; //Tree.distortionOptions.WARP;
    this.fluidDistortion = (this.distortion === Tree.distortionOptions.FLOW) ? ( options?.fluidDistortion ?? new FluidDistortion({
      cols: 40,
      rows: 40,
      k: 0.00085,
    }) ) : null;

    this.qt = new QuadTree( new Rect(0, 0, this.width, this.height), 4 );
    this.attractors = options?.attractors ?? [];

    this.setup();
  }

  setup() {
    let offset = this.width * 0.1;
    let nw = this.width - 2 * offset;
    let nh = this.height - 2 * offset;

    //
    // Set up the trunk/root -- doing this before the attractors makes the
    // placement deterministic regardless of attractor count -- if the external
    // randomness doesn't change. Doesn't hold true when random attractors are
    // generated outside of here and passed in.
    let pos, dir, root;
    for ( let r = this.numRoots; r > 0; r-- ) {
      pos = createVector(offset + Math.floor( Math.random()*nw ), offset + Math.floor( Math.random()*nh ) );
      dir = p5.Vector.sub( createVector( this.width*0.5, this.height*0.5 ), pos ).normalize();
      root = new Branch(null, pos, dir, this.branchLength);

      this.qt.insert( root );
    }
    //
    // If there are no attractors provided, lets create some
    if ( this.attractors.length === 0 ) {
      for (let i = 0, len = this.numAttractors; i < len; i++) {
        // Skip if the attractor would be inside the circle
        let x = Math.floor( Math.random() * nw );
        let y = Math.floor( Math.random() * nh );
        this.attractors.push(new Attractor(
          createVector(offset + x, offset + y)
        ));
      }
    }

    let current = root;
    let found = false;

    while ( !found ) {
      this.attractors.forEach(attractor => {
        let d = p5.Vector.dist(current.pos, attractor.pos);
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
     * order to measure... but the attractors would still need to move AND the I
     * need to remember that we're finding the closest branch. I think this
     * might be a bad idea but will re-evaluate later.
     */

    this.attractors.forEach(attractor => {
      let closestBranch = null;
      let record = this.maxDist;
      
      // DISRUPT THE LEAFS/FOODSOURCE
      switch ( this.distortion ) {
        case Tree.distortionOptions.NONE:
          break;
        case Tree.distortionOptions.SINWAVE1:
          attractor.pos.add(sin(0.5*attractor.pos.y), 0);
          break;
        case Tree.distortionOptions.SINWAVE2:
          attractor.pos.add(sin(2*attractor.pos.y), 0);
          break;
        case Tree.distortionOptions.SINWAVE3:
          attractor.pos.add(2*sin(4*attractor.pos.y), 0);
          break;
        case Tree.distortionOptions.WARP:
          attractor.pos.add(sin(attractor.pos.y + this.seed), (0.5 + 0.5*cos(attractor.pos.x  + this.seed)) * 2);
          break;
        case Tree.distortionOptions.FLOW:
          let xw = attractor.pos.x / width,
              yh = attractor.pos.y / height;
          let dir = this.fluidDistortion.getDirectionFromNormalized( xw, yh ) * 360;
          let mag = this.fluidDistortion.getMagnitudeFromNormalized( xw, yh ) * 10;
          attractor.pos.add( mag * Math.cos( dir ), mag * Math.sin( dir ) );
          break;
      }

      // Look up all of the branches within range
      let branches = this.qt.query(
        new Rect(
          attractor.pos.x - this.MAXDIST_RADIUS,
          attractor.pos.y - this.MAXDIST_RADIUS,
          this.MAXDIST_DIAMETER,
          this.MAXDIST_DIAMETER
        )
      );

      // Find the closest branch to this attractor
      let nn = branches.length;
      let d = 0, branch;
      for ( let pp = 0; pp < nn; pp++ ) {
        branch = branches[ pp ];
        d = attractor.pos.dist( branch.pos );
        if (d < this.minDist) {
          attractor.reached = true;
          closestBranch = null;
          break;
        } else if (d < record) {
          closestBranch = branch;
          record = d;
        }
      };

      // if we found a attractor, add a force to its direction
      if (closestBranch !== null) {
        let newDir = p5.Vector.sub(attractor.pos, closestBranch.pos);
        closestBranch.dir.add( newDir.mult(attractor.weight).normalize() );
        closestBranch.count++;
      }
    }); // End attractor loop

    //
    // Clean up dead attractors
    //
    // for (let i = this.attractors.length - 1; i >= 0; i--) {
    //   this.attractors[i].reached && this.attractors.splice(i, 1);
    // }
    this.attractors = this.attractors.filter( l => l.reached === false );

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
    DEBUG && this.attractors.forEach(attractor => attractor.show());
    let branches = this.qt.flatten();

    this.qt.show();
    
    branches.forEach( branch => branch.show() );
  }
  
  /**
   * Experimental algorithm for climbing "up" the tree to remove
   * duplicate (overlapping) branches and to make the longest possible line.
   * --
   * Naively stash found segments based on a hash of the start and end points.
   **/
  joinAndShow() {
    const USE_SEGMENTS = true;

    let branches = this.qt.flatten();
    /*DEBUG &&*/ console.log(`Full: ${branches.length}`);

    let trimmed = this.dedupe( branches );
    /*DEBUG &&*/ console.log(`Trimmed: ${trimmed.length}`);

    this.qt.show();

    if ( USE_SEGMENTS ) {
    
      let segments = this.createSegments( trimmed );
      /*DEBUG &&*/ console.log(`Segments: ${segments.length}`);

      segments = this.pruneSegments( segments );
      /*DEBUG &&*/ console.log(`Pruned segments: ${segments.length}`);

      let polylines = this.makePolylinesFromSegments( segments, false );
      /*DEBUG &&*/ console.log(`Polylines: ${polylines.length}`);

      
      polylines = this.prunePolylines( polylines, false );
      /**
       * Allow reversals on the next pass to try and lengthen the lines
       * NOTE: This is not optimal and causes some duplicates.
       * TODO: Investigate why pruning with reversal causes this.
       * Assumption: 
       **/
      polylines = this.prunePolylines( polylines, true );
      
      polylines.forEach( p => {
        DEBUG && p.inspect();
        // late set the fnShow for rendering....
        // p.fnShow = v => { Polyline.drawPolyline( v ); Polyline.drawPolyBlobVerticesTranslucent( v ); };
        p.fnShow = this.fnShow;
        // show it
        p.show();
      });

    } else {
      let polylines = this.makePolylines( trimmed );

      polylines.forEach( p => {
        p.simplify();
        p.show();
      });
    }
  }

  prunePolylines( polylines, boolReversal = false ) {
    const MAX_PASSES = 10;
    let passCount = 0;
    let lastLineCount = 0;
    
    do {
      let pruned = [];
      lastLineCount = polylines.length;
      passCount++;

      /*DEBUG && */ console.log(`Begin pass ${passCount}${ boolReversal ? ": Allow reversal" : ""}`);

      // polylines.sort(( a, b ) => a.head.pos.dist( a.tail.pos ) - b.head.pos.dist( b.tail.pos ) );

      // Loop through all of the polylines passed in
      polylines.forEach(( poly, i ) => {
        let prunedPoly,
            p = pruned.length,
            foundMatch = false;

        // Compare the polyline to all the previously pruned polylines
        while ( --p >= 0 && !foundMatch ) {
          prunedPoly = pruned[ p ];
          
          if ( prunedPoly.touchesHeadApproximately( poly.tail.pos ) ) {
            // Head of the segment touches the tail of the polyline
            // -> Add tail of segment to tail of polyline
            prunedPoly.addPolylineToHead( poly );
            foundMatch = true;
          }
  
          if ( prunedPoly.touchesTailApproximately( poly.head.pos ) ) {
            // Tail of the segment touches the head of the polyline
            // -> Add the head of the segment to the head of polyline
            prunedPoly.addPolylineToTail( poly );
            foundMatch = true;
          }

          if ( boolReversal && prunedPoly.touchesHeadApproximately( poly.head.pos ) ) {
            // Heads of the polylines are touching
            // -> Reverse and add to head of polyline
            poly.reverse();
            prunedPoly.addPolylineToHead( poly );
            foundMatch = true;
          }

          if ( boolReversal && prunedPoly.touchesTailApproximately( poly.tail.pos ) ) {
            // Tail of the segment touches the tail of the polyline
            // -> Add head of segment to tail of polyline
            poly.reverse();
            prunedPoly.addPolylineToTail( poly );
            foundMatch = true;
          }
        };

        if ( !foundMatch ) pruned.push( poly );
      });

      polylines = pruned;

      /*DEBUG && */ console.log(`Simplified polylines (Pass ${passCount}): ${polylines.length}`);
    } while ( lastLineCount !== polylines.length && passCount < MAX_PASSES);

    return polylines;
  }

  makePolylinesFromSegments( segments, boolTryTail = false ) {
    let polylines = [];

    /**
     * New sorting
     */
    // segments.sort(( a, b ) => a.head.pos.dist( a.tail.pos ) - b.head.pos.dist( b.tail.pos ));
    /**
     * End sorting
     */
    segments.forEach( s => {
      let poly,
          p = polylines.length,
          foundMatch = false;

      while ( --p >= 0 && !foundMatch ) {
        poly = polylines[ p ];
        if ( !foundMatch && s.touchesHeadApproximately( poly.head.pos ) ) {
          // Head of the segment touches the head of the polyline
          // -> Reverse (take tail of segment) and add to head of polyline
          poly.addToHead( s.tail );
          // DEBUG && console.log("Add tail to head")
          foundMatch = true;
        }

        if ( !foundMatch && s.touchesTailApproximately( poly.head.pos ) ) {
          // Tail of the segment touches the head of the polyline
          // -> Add the head of the segment to the head of polyline
          poly.addToHead( s.head );
          // DEBUG && console.log("Add head to head")
          foundMatch = true;
        }

        if ( !foundMatch && boolTryTail && s.touchesHeadApproximately( poly.tail.pos ) ) {
          // Head of the segment touches the tail of the polyline
          // -> Add tail of segment to tail of polyline
          poly.addToTail( s.tail );
          // DEBUG && console.log("Add tail to tail")
          foundMatch = true;
        }

        if ( !foundMatch && boolTryTail && s.touchesTailApproximately( poly.tail.pos ) ) {
          // Tail of the segment touches the tail of the polyline
          // -> Add head of segment to tail of polyline
          poly.addToTail( s.head );
          // DEBUG && console.log("Add head to tail")
          foundMatch = true;
        }
      };

      // didn't add to an existing Polyline so create a new one
      if ( foundMatch ) {
        if ( DEBUG && poly.inspect() ) {
          console.log("Offending segment:")
          console.log( s.head.pos );
          console.log( s.tail.pos );
        }
        return;
      }

      polylines.push( new Polyline( s.head, s.tail ) );

    });

    return polylines;
  }

  makePolylines( branches ) {
    /**
     * Hella inefficient way of identifying attractor nodes....
     * TODO: be better
     */

    let len = branches.length;
    branches.forEach(( t, i ) => {
      t.isLeaf = true; // optimistic assignment
      t.visited = false;
      for ( let n = 0; n < len; n++ ) {
        if ( n !== i && branches[ n ].parent && branches[ n ].parent.pos === t.pos ) {
          t.isLeaf = false;
        }
      }
    });

    let leafNodes = branches.filter( b => b.isLeaf );
    /** END LEAF IDENT */

    let polylines = [];
    leafNodes.forEach( l => {

      const poly = new Polyline();
      let node = l;

      if( DEBUG ) {
        push();
        noStroke();
        fill( 0 );
        circle( l.pos.x, l.pos.y, 4 );
        pop();
      }

      // To rejoin with an existing path, allow the first `visited` node to
      // be added then abort.
      let abort = false;
      while ( node !== null && !abort ) {
        abort = ( node.visited && node.parent?.visited );
        poly.addToHead( node );
        node.visited = true;
        node = node.parent;
      }

      polylines.push( poly );
    });
    return polylines;
  }

  dedupe( branches ) {
    let visitedHash = new Set();
    for ( let n = branches.length-1; n >= 0; n-- ) {
      let branch = branches[ n ];
      if ( branch.parent === null ) continue;

      /**
       * Create a hash entry representing the segment and only add uniques.
       **/
      const PRECISION = 1; // Higher precision creates more issues. Use 0 or 1.
      let a = branch.pos,
          b = branch.parent.pos;

      // Ensure `a` has the lower x value

      if ( a.x >= b.x ) [ a, b ] = [ b, a ];

      let h = `h${ a.x.toFixed( PRECISION ) }-${ a.y.toFixed( PRECISION ) }-${ b.x.toFixed( PRECISION ) }-${ b.y.toFixed( PRECISION ) }`;

      if ( visitedHash.has( h ) ) {
        branches.splice( n, 1 );
      } else {
        visitedHash.add( h );
      }
    };
    return branches;
  }

  createSegments( branches ) {
    let segments = [];
    /**
     * Create all of the line segments and set the up to prefer Left-to-Right;
     * and when both X coords are the same, prefer Top-to-Bottom.
     **/
    branches.forEach( branch => {
      let p = branch.parent;
      if (p === null) return;
      
      let s;
      if ( nearEqual( branch.pos.x, p.pos.x ) ) {
        if ( branch.pos.y <= p.pos.y ) {
          s = new Segment( branch, p, [255,0,0, 64] /* FOR DEBUGGING */ );
        } else {
          s = new Segment( p, branch, [255,0,0, 64] /* FOR DEBUGGING */ );
        }
      } else if ( nearEqual( branch.pos.y, p.pos.y ) ) {
        if ( branch.pos.x <= p.pos.x ) {
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

  pruneSegments( segments ) {
    const MAX_PASSES = 10;
    let passCount = 0;
    let lastSegmentCount = 0;
    
    do {
      lastSegmentCount = segments.length;
      passCount++;

      /*DEBUG && */ console.log(`Begin pass ${passCount}`);

      segments = this.simplify( segments );

      /*DEBUG && */ console.log(`Simplified segments (Pass ${passCount}): ${segments.length}`);
    } while ( lastSegmentCount !== segments.length && passCount < MAX_PASSES);

    return segments;
  }

  simplify( segments ) {
    let segments_optimized = [];

    segments.forEach(raw => {
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
         */
        let found = false;
        matches.forEach(m => {
          if ( found ) return;

          // TODO: Evaluate is this will help during clean up
          // if ( raw.overlapsApproximately( m ) ) return; // segments are the same
          
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

    return segments_optimized;
  }

  currentConfig() {
    return {
      angle: this.angle,
      branchLength: this.branchLength,
      canvasSize: this.width === this.height ? this.width : -1,
      height: this.height,
      attractors: this.numAttractors,
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