/**
 * The QuadTree uses rectangle objects for all areas ("Rect").
 * All rectangles require the properties x, y, w, h
 * @class Rect
 * @property {number} x         X-Position
 * @property {number} y         Y-Position
 * @property {number} w         Width
 * @property {number} h         Height
 */ 
export class Rect {
  constructor( x, y, w, h ) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    // Sugar ;)
    this.l = x;
    this.t = y;
    this.r = x + w;
    this.b = y + h;
    this.mx = x + w * 0.5;
    this.my = y + h * 0.5;
  }
  contains( node ) {
    return node.pos.x >= this.l &&
      node.pos.x < this.r &&
      node.pos.y >= this.t &&
      node.pos.y < this.b;
  }

  intersects( region ) {
    //
    if (this.l > region.r || this.r < region.l) return false;
    if (this.t > region.b || this.b < region.t) return false;
    return true;
  }
}

export default class QuadTree {
  /**
   * The QuadTree uses rectangle objects for all areas ("Rect").
   * All rectangles require the properties x, y, width, height
   * @class QuadTree
   * @param {Rect} region      Region bounding box
   * @param {number} capacity  Maximum capacity
   */ 
  constructor(region, capacity) {
    this.region = region;
    this.capacity = capacity;
    this.items = [];
    this.divided = false;
    this.subregions = {
      nw: null,
      ne: null,
      sw: null,
      se: null
    };
  }

  hasCapacity() {
    return this.divided === false && this.items.length < this.capacity;
  }

  subdivide() {
    if ( this.region.w <= 16 || this.region.h <= 16 ) return false;

    let halfW = this.region.w * 0.5;
    let halfH = this.region.h * 0.5;

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

    // insert all previous nodes
    while ( this.items.length ) {
      // attempt to insert into child regions
      this.insertIntoRegion( this.items.pop() );
    }

    return this.divided;
  }

  query( region ) {
    let itemsFound = [];

    if ( !this.region.intersects( region ) ) return itemsFound; // empty array

    if ( this.divided ) {
      itemsFound = itemsFound.concat( this.subregions.nw.query( region ) );
      itemsFound = itemsFound.concat( this.subregions.ne.query( region ) );
      itemsFound = itemsFound.concat( this.subregions.sw.query( region ) );
      itemsFound = itemsFound.concat( this.subregions.se.query( region ) );
    } else {
      itemsFound = itemsFound.concat( this.items.filter(i => region.contains( i )) );
    }
    return itemsFound;
  }

  flatten() {
    if ( !this.divided ) return [].concat(this.items);

    return [].concat(
      this.subregions.nw.flatten(),
      this.subregions.ne.flatten(),
      this.subregions.sw.flatten(),
      this.subregions.se.flatten()
    );
  }

  insert(node) {
    if ( !this.region.contains( node ) ) return false; // not in my region

    if ( this.hasCapacity() ) {
      this.items.push( node );
      return true;
    }

    // no capacity so subdivide if necessary
    if ( !this.divided ) {
      if ( !this.subdivide() ) return false; // failed to subdivide; dropping new node
    }
    // attempt to insert into child regions
    return this.insertIntoRegion( node );
  }

  insertIntoRegion(node) {
    if ( this.subregions.nw.insert( node ) ) return true;
    if ( this.subregions.ne.insert( node ) ) return true;
    if ( this.subregions.sw.insert( node ) ) return true;
    if ( this.subregions.se.insert( node ) ) return true;
    return false;
  }

  print() {
    console.log("== == == == ==\n");
    console.log("QuadTree Print ==");
    console.log(`  > items: ${this.items.length}`);
    console.log(`  > Divided: ${this.divided}`);
    if (this.items.length > 0) {
      console.log(this.items);
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

  show( ctx ) {
    if ( !this.divided ) {
      ctx.rect( this.region.w, this.region.h )
        .fill( this.items.length ? "#F4E8C9" : "none" )
        .stroke({ weight: 0.5, color: "#FAF3E3" })
        .move( this.region.x, this.region.y );
    }

    if (this.subregions.nw !== null) this.subregions.nw.show( ctx );
    if (this.subregions.ne !== null) this.subregions.ne.show( ctx );
    if (this.subregions.sw !== null) this.subregions.sw.show( ctx );
    if (this.subregions.se !== null) this.subregions.se.show( ctx );
  }
}