// Dramatically modified but inspired by Daniel Shiffman
// Code for: https://youtu.be/kKT0v3qhIQY

const DEBUG = !true;

const DISTORTION_OPTIONS = {
  NONE: 1,
  SINWAVE1: 2,
  SINWAVE2: 3,
  SINWAVE3: 4,
  WARP: 5
};
const distortion = DISTORTION_OPTIONS.NONE; //DISTORTION_OPTIONS.WARP;

function Tree(numLeaves, branchLength = 4) {
  this.qt = new QuadTree(new Rect(0, 0, width, height), 4);
  this.leaves = [];

  let l = numLeaves || 500;

  // Create some leaves
  let w = 0;
  let offset = width / 10;
  let nw = width - 2 * offset;
  let nh = height - 2 * offset;
  for (var i = 0; i < l; i++) {
    w = Math.ceil(Math.random() * 10);
    // Skip if the leaf/attractor would be inside the circle
    let x = Math.floor(Math.random()*nw);
    let y = Math.floor(Math.random()*nh);
    let xr = x - nw/2;
    let yr = y - nh/2;
    // let sdfContainer = 1.0; // Math.sign(4*offset - Math.sqrt(xr * xr + yr * yr));
    // let sdfBite = 1.0;// Math.sign(Math.sqrt(xr * xr + yr * yr) - 2*offset);
    // if (sdfContainer > 0 && sdfBite > 0) {
      this.leaves.push(new Leaf(
        w, // weight
        createVector(offset + x, offset + y)
      ));
    // }
  }

  // Set up the trunk/root
  // var pos = createVector(width * 0.25, height * 0.25);
  var pos = createVector(width * 0.5, height * 0.5);
  // var pos = createVector(Math.random()*0.2*width + width * 0.5, height * 0.5);
  // var pos = createVector(Math.random()*0.2*width + width * 0.75, height * 0.2);
  var dir = createVector(0, 1.0);
  var root = new Branch(null, pos, dir, branchLength);

  this.qt.insert(root);

  var current = root;
  var found = false;


  while (!found) {
    this.leaves.forEach(leaf => {
      var d = p5.Vector.dist(current.pos, leaf.pos);
      if (d < MAXDIST) {
        found = true;
      }
    });
    if (!found) {
      var branch = current.next();
      current = branch;
      this.qt.insert(current);
    }
  }

  this.grow = function() {

    this.leaves.forEach(leaf => {
      var closestBranch = null;
      var record = MAXDIST;
      
      // ** DISRUPT THE LEAFS/FOODSOURCE
      switch (distortion) {
        case DISTORTION_OPTIONS.SINWAVE1:
          leaf.pos.add(sin(0.5*leaf.pos.y), 0);
          break;
        case DISTORTION_OPTIONS.SINWAVE2:
          leaf.pos.add(sin(2*leaf.pos.y), 0);
          break;
        case DISTORTION_OPTIONS.SINWAVE3:
          leaf.pos.add(2*sin(4*leaf.pos.y), 0);
          break;
        case DISTORTION_OPTIONS.WARP:
          leaf.pos.add(sin(leaf.pos.y), (0.5 + 0.5*cos(leaf.pos.x)) * 2);
          break;
        case DISTORTION_OPTIONS.NONE:
          break;
      }
      // **/

      let branches = this.qt.query(
        new Rect(
          leaf.pos.x - MAXDIST_3over2,
          leaf.pos.y - MAXDIST_3over2,
          MAXDIST_3,
          MAXDIST_3
        )
      );

      branches.forEach(branch => {
        if (leaf.reached) return;
        var d = p5.Vector.dist(leaf.pos, branch.pos);
        if (d < MINDIST) {
          leaf.reached = true;
          closestBranch = null;
        } else if (d < record) {
          closestBranch = branch;
          record = d;
        }
      });

      
      if (closestBranch != null) {
        var newDir = p5.Vector.sub(leaf.pos, closestBranch.pos);
        closestBranch.dir.add(newDir.mult(leaf.weight).normalize());
        closestBranch.count++;
      }
    });

    // Clean up dead leaves
    for (var i = this.leaves.length - 1; i >= 0; i--) {
      if (this.leaves[i].reached) {
        this.leaves.splice(i, 1);
      }
    }

    //
    // How can I traverse the whole list if it's in a QuadTree?
    //
    let branches = this.qt.flatten();
    let branch;
    for (var i = branches.length - 1; i >= 0; i--) {
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

        /* OR, Round to the nearest N degrees */
        // let theta = Math.round(branch.dir.heading() / N) * N;
        
        /* OR, Round to the nearest N degrees and force left-hand turns */
        let theta = Math.floor(branch.dir.heading() / N) * N;
        
        // OR, Round to the nearest N degrees and force right-hand turns
        // let theta = Math.ceil(branch.dir.heading() / N) * N;
        
        branch.dir.rotate(theta - branch.dir.heading());
        // console.log(theta);
        this.qt.insert(branch.next());
        branch.reset();
      }
    }
  }
  
  this.flatten = function() {    
    return this.qt.flatten();
  }
  
  this.show = function() {
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
  this.joinAndShow = function() {
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

      segments = this._simplify( segments );

      /*DEBUG && */ console.log(`Simplifed segments (Pass ${passCount}): ${segments.length}`);
    } while ( lastSegmentCount !== segments.length && passCount < MAX_PASSES);

    segments.forEach(s => {
      DEBUG && stroke( s.c );
      // TODO: Find a way to call the stored `branch.show` method instead of
      // manually recreating it.
      line(s.x1, s.y1, s.x2, s.y2);
    });
    
  }
  
  this._dedupe = function(t) {
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


  this.createSegments = function( t ) {
    let branches = [...t];
    let segments = [];
    // Create all of the line segments and set the up to
    // prefer Left-to-Right; and when both X coords are the same,
    // prefer Top-to-Bottom.
    branches.forEach((branch) => {
      let p = branch.parent;
      if (p === null) return;
      
      let s = {};
      
      if (branch.pos.x <= p.pos.x) {
        s = {
          x1: branch.pos.x,
          y1: branch.pos.y,
          x2: p.pos.x,
          y2: p.pos.y,
          c: [0,0,255, 64], // FOR DEBUGGING
        };
      } else {
        if (branch.pos.y < p.pos.y) {
          s = {
            x1: branch.pos.x,
            y1: branch.pos.y,
            x2: p.pos.x,
            y2: p.pos.y,
            c: [0,255,0, 64], // FOR DEBUGGING
          };
        } else {
          s = {
            x1: p.pos.x,
            y1: p.pos.y,
            x2: branch.pos.x,
            y2: branch.pos.y,
            c: [255,0,0, 64], // FOR DEBUGGING
          };
        }
      }
      s.slope = (s.y2 - s.y1) / (s.x2 - s.x1);
      segments.push( s );
    });
    return segments;
  }
  /** ************************************
   *
   *
   *
   **/
  
  this._simplify = function(t) {

    let segments_raw = [...t];
    let segments_optimized = [];

    segments_raw.forEach(raw => {
      // See if we can extend an existing segment
      
      // Find same slope
      let matches = segments_optimized.filter(opti => {
        let o_slope = ( opti.y2 - opti.y1 ) / ( opti.x2 - opti.x1 ) ; 
        // Use `nearEqual` because floating point rounding does some awkward shit :/
        return nearEqual( raw.slope, o_slope );
      });
      
      // console.log("Matches: ", matches.length);
      
      if ( matches.length === 0 ) {
        segments_optimized.push( raw );
      } else {
        let found = false;
        matches.forEach(m => {
          if ( found ) return;
          // if ( raw.x1 === m.x2 && raw.y1 === m.y2 ) {
          if ( nearEqual( raw.x1, m.x2 ) && nearEqual( raw.y1, m.y2) ) {
            // Extend the optimized segment "BEFORE"
            m.x2 = raw.x2;
            m.y2 = raw.y2;
            found = true;
            // console.log("Extending BEFORE");
          } else {
            // if ( raw.x2 === m.x1 && raw.y2 === m.y1 ) {
            if ( nearEqual( raw.x2, m.x1 ) && nearEqual( raw.y2, m.y1 ) ) {
              // Extend the optimized segment "AFTER"
              m.x1 = raw.x1;
              m.y1 = raw.y1;
              found = true;
              // console.log("Extending AFTER");
            }
          }
        });
        if ( !found ) {
          // NO MATCH so we need to move it in
          segments_optimized.push( raw );
          // console.log("NO MATCH")
        }
      }
    });

    return segments_optimized;
  }
}

/**
 * return TRUE if a is within delta of b
 * return FALSE otherwise
 **/
function nearEqual( a, b, deltaOverride ) {
  const delta = deltaOverride ?? 0.05; // 0r 0.025?
  return Math.abs(b - a) < delta;
}




