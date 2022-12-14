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

function scalarMultiply(u: vec3, scalar: number) {
  return {x: u.x * scalar, y: u.y * scalar, z: u.z * scalar};
}

function scalarDivide(u: vec3, scalar: number) {
  return {x: u.x / scalar, y: u.y / scalar, z: u.z / scalar};
}

function normalize(u: vec3): vec3 {
  return scalarDivide(u, length(u))
}

function average(vecs: vec3[]): vec3 {
  return scalarDivide(vecs.reduce((acc,vec) => plus(acc,vec)), vecs.length);
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

// tests for these too would be pretty sick
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
  // update each boid 
  for(let i = 0; i < boids.length; ++i) {
    // get nearby boids
    const nearbyBoids: Boid[] = getBoidsNearBoid(boids, boids[i], 20.0);
    const tooCloseBoids: Boid[] = getBoidsNearBoid(boids, boids[i], 5.0);
   
    // maintain separation from boids that are too close
    if(tooCloseBoids.length > 0 ) {
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

    // stay within the limits of the playground
    const turnConstant = 0.25;
    const boxSize = 100;
    if(length(boids[i].position) > boxSize) {
      boids[i].velocity = minus(boids[i].velocity, scalarMultiply(normalize(boids[i].position), turnConstant));
    }

    // step physics forward (integration step)
    update(boids[i], dt);
  }
}

export {Boid, updateAllBoids };