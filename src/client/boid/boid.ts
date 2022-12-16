// simple export for testing unit testing
export function sampleFunction(x: string): string {
  return x + x;
}

// TODO(jllusty): scope with a 'declare namespace'
// spatial indexing scheme
interface index {
  i: number,
  j: number,
  k: number
}

function toString(spatialIndex: index): string {
  return "(" + spatialIndex.i.toString() + ", " + spatialIndex.j.toString() + ", " + spatialIndex.k.toString() + ")"
}

// 3-d vector Datatype
interface vec3 {
  x: number,
  y: number,
  z: number
}

// write tests for these you silly dumb dumb
function plus(u: vec3, v: vec3): vec3 {
  return {x: u.x + v.x, y: u.y + v.y, z: u.z + v.z};
}

function minus(u: vec3, v: vec3): vec3 {
  return {x: u.x - v.x, y: u.y - v.y, z: u.z - v.z};
}

function dot(u: vec3, v: vec3): number {
  return u.x * v.x + u.y * v.y + u.z * v.z;
}

function length(u: vec3): number {
  return Math.sqrt(dot(u,u));
}

function scalarMultiply(u: vec3, scalar: number): vec3 {
  return {x: u.x * scalar, y: u.y * scalar, z: u.z * scalar};
}

function scalarDivide(u: vec3, scalar: number): vec3 {
  return {x: u.x / scalar, y: u.y / scalar, z: u.z / scalar};
}

function normalize(u: vec3): vec3 {
  return scalarDivide(u, length(u))
}

function average(vecs: vec3[]): vec3 {
  return scalarDivide(vecs.reduce((acc,vec) => plus(acc,vec)), vecs.length);
}

function spatialIndex(u: vec3): index {
  const gridSize = {w: 10, h: 10, l: 10};
  return {i: u.x/gridSize.w, j: u.y/gridSize.h, k: u.z/gridSize.l};
}

// Boid Datatype
interface Boid {
  // uuid
  label: string,
  // position vector
  position: vec3,
  // unit vector
  orientation: vec3,
  // velocity
  velocity: vec3
}

// Box o' Boids
// Spatially-indexed boids
type grid = Map<index, Boid[]>;

// tests for these too would be pretty sick
// returns a spatial index for a boid
function getSpatialIndexOfBoid(boid: Boid): index {
  return spatialIndex(boid.position);
}

// mutates grid
function addBoidToGrid(boid: Boid, g: grid) {
  const spatialIndex = getSpatialIndexOfBoid(boid);
  if(!g.has(spatialIndex)) {
    g.set(spatialIndex, []);
  }
  g.get(getSpatialIndexOfBoid(boid))?.push(boid);
}

function createGrid(boids: Boid[]): grid {
  const g: grid = new Map<index, Boid[]>();
  boids.forEach((boid) => addBoidToGrid(boid,g));
  return g;
}

// returns length of the displacement vector between two boids
function distanceBetweenBoids(boid1: Boid, boid2: Boid): number {
  // displacement from boid1 to boid2
  return length(minus(boid1.position, boid2.position));
}

// get boids surrounding a boid within a threshold
function getBoidsNearBoid(boids: Boid[], boid: Boid, threshold: number): Boid[] {
  return boids.filter(b => b !== boid).filter(b => distanceBetweenBoids(b,boid) < threshold);
}

// get average location of Boids
function averagePosition(boids: Boid[]): vec3 {
  return average(boids.map(boid => boid.position));
}
// get average velocity of Boids
function averageVelocity(boids: Boid[]): vec3 {
  return average(boids.map(boid => boid.velocity));
}

// boid update function (boid, deltatime) -> boid
function update(boid: Boid, dt: number) {
  boid.position = plus(boid.position, scalarMultiply(boid.velocity, dt));
}

// collective (global) boid update
function updateAllBoids(boids: Boid[], dt: number) {
  // index each boid
  const theGrid = createGrid(boids);
  // theGrid.forEach((boids,spatialIndex) => console.log(toString(spatialIndex) + ": " + boids.length.toString()));

  // update each boid 
  for(let i = 0; i < boids.length; ++i) {
    // get spatial index
    // TODO(jllusty): use created grid to discern boids that are too close
    const spatialIndex = getSpatialIndexOfBoid(boids[i]);
    // get nearby boids
    const nearbyBoids: Boid[] = getBoidsNearBoid(boids, boids[i], 20.0);
    const tooCloseBoids: Boid[] = getBoidsNearBoid(boids, boids[i], 5.0);
   
    // maintain separation from boids that are too close
    if(tooCloseBoids !== undefined && tooCloseBoids.length > 0 ) {
      // 1. separation: avoid colliding into other boids, move away from their average position
      const separationConstant = 0.05;
      const avgPositionTooCloseBoids: vec3 = averagePosition(tooCloseBoids);
      const awayFromTooCloseBoids: vec3 = minus(boids[i].position, avgPositionTooCloseBoids);
      boids[i].velocity = plus(boids[i].velocity, scalarMultiply(awayFromTooCloseBoids, separationConstant));
    }

    // steer towards the average location and align with nearby boids
    if(nearbyBoids.length > 0) {
      // 2. cohesion: steer towards average position of nearby boids
      const cohesionConstant = 0.01;
      const avgPositionNearbyBoids: vec3 = averagePosition(nearbyBoids);
      const towardsNearbyBoids: vec3 = minus(avgPositionNearbyBoids, boids[i].position);
      boids[i].velocity = plus(boids[i].velocity, scalarMultiply(towardsNearbyBoids, cohesionConstant));

      // 3. alignment: steer to match the velocity of nearby boids
      const avgVelocityNearbyBoids: vec3 = averageVelocity(nearbyBoids);
      const alignmentConstant = 0.01;
      const realignVelocityWithNearbyBoids: vec3 = minus(avgVelocityNearbyBoids, boids[i].velocity);
      boids[i].velocity = plus(boids[i].velocity, scalarMultiply(realignVelocityWithNearbyBoids, alignmentConstant));
    }

    // the following update should have the Boids steer to avoid the edge of the spherical playground
    const r = length(boids[i].position);
    const R = 100;
    const turnConstant = 0.5;
    if (r > 0.75*R) {
      boids[i].velocity = minus(boids[i].velocity, scalarMultiply(normalize(boids[i].position), turnConstant));
    }
    
    // if(boids[i].position < )0
    // stay within the limits of the playground
    // const turnConstant = 0.25;
    // const boxSize = 100;
    // if(length(boids[i].position) > boxSize) {
    // boids[i].velocity = minus(boids[i].velocity, scalarMultiply(normalize(boids[i].position), turnConstant));
    // }

    // limit velocity
    const V = 10.0;
    //if(length(boids[i].velocity) > V) {
    //  boids[i].velocity = scalarMultiply(normalize(boids[i].velocity), V);
    //}

    // step physics forward (integration step)
    update(boids[i], dt);

    // collision resolution: take the max vector
    if (r >= R) {
      boids[i].position = scalarMultiply(normalize(boids[i].position), R);
    }

    // give them something to chase


  }
}

export {Boid, updateAllBoids };