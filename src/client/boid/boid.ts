// statistical utility functions
export function cumulativeAverageUpdate(
  currentAverage: number, 
  numCurrentObservations: number, 
  newObservation: number): number
{
  const deltaAverage = (newObservation - currentAverage)/(numCurrentObservations + 1);
  return currentAverage + deltaAverage;
}

// TODO(jllusty): scope with a 'declare namespace'
// spatial indexing scheme
export interface index {
  i: number,
  j: number,
  k: number
}

// 3-d vector Datatype
export interface vec3 {
  x: number,
  y: number,
  z: number
}

// write tests for these you silly dumb dumb
export function plus(u: vec3, v: vec3): vec3 {
  return {x: u.x + v.x, y: u.y + v.y, z: u.z + v.z};
}

export function minus(u: vec3, v: vec3): vec3 {
  return {x: u.x - v.x, y: u.y - v.y, z: u.z - v.z};
}

export function dot(u: vec3, v: vec3): number {
  return u.x * v.x + u.y * v.y + u.z * v.z;
}

export function length(u: vec3): number {
  return Math.sqrt(dot(u,u));
}

export function scalarMultiply(u: vec3, scalar: number): vec3 {
  return {x: u.x * scalar, y: u.y * scalar, z: u.z * scalar};
}

export function scalarDivide(u: vec3, scalar: number): vec3 {
  return {x: u.x / scalar, y: u.y / scalar, z: u.z / scalar};
}

export function normalize(u: vec3): vec3 {
  return scalarDivide(u, length(u))
}

export function average(vecs: vec3[]): vec3 {
  return scalarDivide(vecs.reduce((acc,vec) => plus(acc,vec)), vecs.length);
}

export function cumulativeAverageUpdateVec3(
  currentAverage: vec3,
  numCurrentObservations: number,
  newObservation: vec3): vec3
{
  // original average
  const ox = currentAverage.x, oy = currentAverage.y, oz = currentAverage.z;
  // new observation
  const nx = newObservation.x, ny = newObservation.y, nz = newObservation.z;

  // cumulative average in each dimension
  return {
    x: cumulativeAverageUpdate(ox, numCurrentObservations, nx),
    y: cumulativeAverageUpdate(oy, numCurrentObservations, ny),
    z: cumulativeAverageUpdate(oz, numCurrentObservations, nz)
  }
}

export function spaceToIndex1d(xMin: number, xMax: number, xSegments: number, x: number): number {
  return Math.floor((xSegments - 1) * (x - xMin) / (xMax - xMin));
}

export function spatialIndex(gridParams: GridParameters, u: vec3): index {
  const gridX = spaceToIndex1d(gridParams.xMin, gridParams.xMax, gridParams.xNumSegments, u.x);
  const gridY = spaceToIndex1d(gridParams.yMin, gridParams.yMax, gridParams.yNumSegments, u.y);
  const gridZ = spaceToIndex1d(gridParams.zMin, gridParams.zMax, gridParams.zNumSegments, u.z);
  return {i: gridX, j: gridY, k: gridZ};
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
export interface GridParameters {
  // corresponding bounds in x, y, and z
  xMin: number, xMax: number,
  yMin: number, yMax: number,
  zMin: number, zMax: number,
  // number of cells in x, y, and z
  xNumSegments: number,
  yNumSegments: number,
  zNumSegments: number
}

export interface Grid {
  gridParams: GridParameters,
  // querable 3d-grid array for array of boids
  boids: Boid[][][][],
  // queryable 3d-grid array for average positions and velocities
  averagePositions: vec3[][][],
  averageVelocities: vec3[][][]
}

// tests for these too would be pretty sick
// returns a spatial index for a boid
export function getSpatialIndexOfBoid(gridParams: GridParameters, boid: Boid): index {
  return spatialIndex(gridParams, boid.position);
}

// sometimes you realize that you should
// just use a grid instead of a stupid
// ES6 map (ಠ ͜ʖಠ)
export function createGridFromBoids(gridParams: GridParameters, boids: Boid[]): Grid {
  let boids3Grid: Boid[][][][] = [];
  let averagePositions: vec3[][][] = [];
  let averageVelocities: vec3[][][] = [];

  // this is probably a chunk of the time required for this function,
  // I wonder if there is a faster way 
  for(let i = 0; i < gridParams.xNumSegments; ++i) {
    boids3Grid[i] = [];
    averagePositions[i] = [];
    averageVelocities[i] = [];
    for(let j = 0; j < gridParams.yNumSegments; ++j) {
      boids3Grid[i][j] = [];
      averagePositions[i][j] = [];
      averageVelocities[i][j] = [];
      for(let k = 0; k < gridParams.zNumSegments; ++k) {
        boids3Grid[i][j][k] = [];
        averagePositions[i][j][k] = {x: 0, y: 0, z: 0};
        averageVelocities[i][j][k] = {x: 0, y: 0, z: 0};
      }
    }
  }

  for(let i = 0; i < boids.length; ++i) {
    const ind = spatialIndex(gridParams, boids[i].position);
    averagePositions[ind.i][ind.j][ind.k] = cumulativeAverageUpdateVec3(
      averagePositions[ind.i][ind.j][ind.k],
      boids3Grid[ind.i][ind.j][ind.k].length,
      boids[i].position
    )
    averageVelocities[ind.i][ind.j][ind.k] = cumulativeAverageUpdateVec3(
      averageVelocities[ind.i][ind.j][ind.k],
      boids3Grid[ind.i][ind.j][ind.k].length,
      boids[i].velocity
    )
    boids3Grid[ind.i][ind.j][ind.k].push(boids[i]);
  }

  return {
    gridParams: gridParams, 
    boids: boids3Grid,
    averagePositions: averagePositions,
    averageVelocities: averageVelocities
  };
}

// returns length of the displacement vector between two boids
export function distanceBetweenBoids(boid1: Boid, boid2: Boid): number {
  // displacement from boid1 to boid2
  return length(minus(boid1.position, boid2.position));
}

// get boids surrounding a boid within a threshold
export function getBoidsNearBoid(boids: Boid[], boid: Boid, threshold: number): Boid[] {
  return boids.filter(b => b !== boid).filter(b => distanceBetweenBoids(b,boid) < threshold);
}

// get average location of Boids
export function averagePosition(boids: Boid[]): vec3 {
  return average(boids.map(boid => boid.position));
}
// get average velocity of Boids
export function averageVelocity(boids: Boid[]): vec3 {
  return average(boids.map(boid => boid.velocity));
}

// boid update function (boid, deltatime) -> boid
export function update(boid: Boid, dt: number) {
  boid.position = plus(boid.position, scalarMultiply(boid.velocity, dt));
}

// test grid parameters, move these elsewhere (main?)
const testGridParameters: GridParameters = {
    xMin: -100, xMax: 100,
    yMin: -100, yMax: 100,
    zMin: -100, zMax: 100,
    xNumSegments: 50,
    yNumSegments: 50,
    zNumSegments: 50
}

// collective (global) boid update
function updateAllBoids(boids: Boid[], dt: number) {
  // index each boid, rip performance
  const grid = createGridFromBoids(testGridParameters, boids);

  // update each boid 
  for(let i = 0; i < boids.length; ++i) {
    // get spatial index
    // TODO(jllusty): use created grid to discern boids that are too close
    const ind = getSpatialIndexOfBoid(testGridParameters, boids[i]);
    // get nearby boids
    //const nearbyBoids: Boid[] = grid.boids[ind.i][ind.j][ind.k];
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
    
    // limit velocity
    const V = 30.0;
    if(length(boids[i].velocity) > V) {
      boids[i].velocity = scalarMultiply(normalize(boids[i].velocity), V);
    }

    // TODO: give them something moving to chase

    // step physics forward (integration step)
    update(boids[i], dt);

    // collision resolution: take the max vector
    if (r >= R) {
      boids[i].position = scalarMultiply(normalize(boids[i].position), R);
    }

  }
}



export {Boid, updateAllBoids, testGridParameters };