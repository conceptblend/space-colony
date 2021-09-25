// class Point {
//   constructor(x, y) {
//     this.x = x;
//     this.y = y;
//   }
// }

class Rect {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    // Sugar ;)
    this.l = x;
    this.t = y;
    this.r = x + w;
    this.b = y + h;
    this.mx = x + w / 2;
    this.my = y + h / 2;
  }
  contains(node) {
    return (node.pos.x >= this.l && node.pos.x < this.r &&
      node.pos.y >= this.t && node.pos.y < this.b);
  }

  intersects(range) {
    //
    if (this.l > range.r || this.r < range.l) return false;
    if (this.t > range.b || this.b < range.t) return false;
    return true;
  }
}

class QuadTree {
  constructor(region, capacity) {
    this.region = region;
    this.capacity = capacity;
    this.nodes = [];
    this.divided = false;
    this.subregions = {
      nw: null,
      ne: null,
      sw: null,
      se: null
    };
  }

  hasCapacity() {
    return this.nodes.length < this.capacity;
  }

  subdivide() {
    if (this.region.w <= 1 || this.region.h <= 1) return false;

    let halfW = this.region.w / 2;
    let halfH = this.region.h / 2;

    this.subregions.nw = new QuadTree(
      new Rect(
        this.region.x,
        this.region.y,
        halfW,
        halfH
      ),
      this.capacity
    );
    this.subregions.ne = new QuadTree(
      new Rect(
        this.region.mx,
        this.region.y,
        halfW,
        halfH
      ),
      this.capacity
    );
    this.subregions.sw = new QuadTree(
      new Rect(
        this.region.x,
        this.region.my,
        halfW,
        halfH
      ),
      this.capacity
    );
    this.subregions.se = new QuadTree(
      new Rect(
        this.region.mx,
        this.region.my,
        halfW,
        halfH
      ),
      this.capacity
    );
    this.divided = true;
    return this.divided;
  }

  query(range) {
    let found = [];

    if (!this.region.intersects(range)) return found; // empty array

    if (this.divided) {
      found = found.concat(this.subregions.nw.query(range));
      found = found.concat(this.subregions.ne.query(range));
      found = found.concat(this.subregions.sw.query(range));
      found = found.concat(this.subregions.se.query(range));
    } else {
      this.nodes.forEach(p => {
        if (range.contains(p)) {
          found.push(p);
        }
      });
    }
    return found;
  }

  flatten() {
    let found = [];

    if (this.divided) {
      found = found.concat(
        this.subregions.nw.flatten(),
        this.subregions.ne.flatten(),
        this.subregions.sw.flatten(),
        this.subregions.se.flatten()
      );
    } else {
      found = found.concat(this.nodes);
    }
    return found;
  }

  insert(node) {
    if (!this.region.contains(node)) return false; // not in my region

    if (this.hasCapacity() && !this.divided) {
      this.nodes.push(node);
      return true;
    } else {
      // subdivide and insert
      if (!this.divided) {
        let couldDivide = this.subdivide();

        // If we're down to the unit cell, stop subdividing
        if (couldDivide) {
          // insert all previous nodes
          let n = this.nodes.length;
          for (var p = 0; p < n; p++) {
            // attempt to insert into child regions
            this.insertIntoRegion(this.nodes.pop());
          }
        } else {
          // console.log("lost a node");
          return false;
        }
      }
      // attempt to insert into child regions
      return this.insertIntoRegion(node);
    }
    return false;
  }

  insertIntoRegion(node) {
    if (this.subregions.nw.insert(node)) return true;
    if (this.subregions.ne.insert(node)) return true;
    if (this.subregions.sw.insert(node)) return true;
    if (this.subregions.se.insert(node)) return true;
  }

  print() {
    console.log("== == == == ==\n");
    console.log("QuadTree Print ==");
    console.log(`  > nodes: ${this.nodes.length}`);
    console.log(`  > Divided: ${this.divided}`);
    if (this.nodes.length > 0) {
      console.log(this.nodes);
    }

    console.log(`  > Subregion: NW`);
    if (this.subregions.nw !== null) this.subregions.nw.print();
    console.log(`  > Subregion: NE`);
    if (this.subregions.ne !== null) this.subregions.ne.print();
    console.log(`  > Subregion: SW`);
    if (this.subregions.sw !== null) this.subregions.sw.print();
    console.log(`  > Subregion: SE`);
    if (this.subregions.se !== null) this.subregions.se.print();
  }

  show(quadIndex) {
    noFill();
    stroke(255);
    strokeWeight(1);
    // noStroke();
    let c = quadIndex || 0;

    // if (this.divided === false && this.nodes.length > 0) {
    //   fill(this.nodes.length * 48, c * 48, c * 48);
    //   // noStroke();
    // } else {
    //   noFill();
    // }
    rect(this.region.x, this.region.y, this.region.w, this.region.h);

    this.nodes.forEach(p => circle(p.pos.x, p.pos.y, 2));

    if (this.subregions.nw !== null) this.subregions.nw.show(0);
    if (this.subregions.ne !== null) this.subregions.ne.show(1);
    if (this.subregions.sw !== null) this.subregions.sw.show(2);
    if (this.subregions.se !== null) this.subregions.se.show(3);
  }

}