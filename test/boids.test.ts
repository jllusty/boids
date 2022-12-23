import * as BOID from '../src/client/boid/boid';
// just did this for a convenient uuid, but apparently limits to non-https connections
import * as CRYPTO from 'crypto';

// test grid parameters
const testGridParameters: BOID.GridParameters = {
    xMin: -100, xMax: 100,
    yMin: -100, yMax: 100,
    zMin: -100, zMax: 100,
    xNumSegments: 10,
    yNumSegments: 10,
    zNumSegments: 10
}

// get boid at random position, should probably be moved out of tests into boids.ts
function getStationaryBoidAtRandomPosition(gridParams: BOID.GridParameters): BOID.Boid {
    let randPoint = (xMin: number, xMax: number) => xMin + (xMax - xMin) * Math.random();
	const px = randPoint(gridParams.xMin, gridParams.xMax);
	const py = randPoint(gridParams.yMin, gridParams.yMax);
	const pz = randPoint(gridParams.zMin, gridParams.zMax);

    return {
        label: CRYPTO.randomUUID(),
        position: {x: px, y: py, z: pz},
        velocity: {x: 0, y: 0, z: 0},
        orientation: {x: 0, y: 0, z: 0}
    };
}

describe("tests for the index and vec3 interfaces and functions", () => {
    // test that vector(s) are in their expected cell indices for
    // the testGridParameters
    test("test spatial index of vec3", () => {
        const pos: BOID.vec3 = {x: 11, y: -22, z: 42};
        const ind: BOID.index = {i: 4, j: 3, k: 6};
        expect(BOID.spatialIndex(testGridParameters, pos)).toEqual(ind);
    });

    // test that the grid created with testGridParameters and
    // N=1000 random stationary boids contains all of the
    // boids in their respective cell
    test("test create grid w/ N=1000 boids at random positions", () => {
        const eps = 0.001;
        // create N randomly-positioned, stationary boids
        const N = 1000;
        let testBoids: BOID.Boid[] = []
        for(let i = 0; i < N; ++i) {
            testBoids.push(getStationaryBoidAtRandomPosition(testGridParameters));
        }

        // create a grid with those boids
        const grid: BOID.Grid = BOID.createGridFromBoids(testGridParameters, testBoids);    

        // test that all boids are in their respective spatially-indexed cells
        for(let i = 0; i < N; ++i) {
            let ind: BOID.index = BOID.getSpatialIndexOfBoid(testGridParameters, testBoids[i]);
            expect(grid.boids[ind.i][ind.j][ind.k].find((b) => b.label === testBoids[i].label) !== undefined).toBeTruthy();
        }

        // test that the boids contained in the grid at each spatial index have an average position and velocity
        // that the grid returns for that index
        for(let i = 0; i < grid.averagePositions.length; ++i) {
            for(let j = 0; j < grid.averagePositions[i].length; ++j) {
                for(let k = 0; k < grid.averagePositions[i][j].length; ++k) {
                    // boids
                    const boids: BOID.Boid[] = grid.boids[i][j][k];
                    if(boids.length === 0) continue;

                    // average their positions and velocities
                    let averagePosition: BOID.vec3 = {x: 0, y: 0, z: 0};
                    let averageVelocity: BOID.vec3 = {x: 0, y: 0, z: 0};
                    for(let b = 0; b < boids.length; ++b) {
                        averagePosition = BOID.plus(averagePosition, boids[b].position);
                        averageVelocity = BOID.plus(averageVelocity, boids[b].velocity);
                    }
                    averagePosition = BOID.scalarDivide(averagePosition, boids.length);
                    averageVelocity = BOID.scalarDivide(averageVelocity, boids.length);

                    // indexed average position and velocity
                    const indexedAveragePosition: BOID.vec3 = grid.averagePositions[i][j][k];
                    const indexedAverageVelocity: BOID.vec3 = grid.averageVelocities[i][j][k];

                    expect(BOID.length(BOID.minus(indexedAveragePosition,averagePosition)) < eps).toBeTruthy();
                    expect(BOID.length(BOID.minus(indexedAverageVelocity,averageVelocity)) < eps).toBeTruthy();
                }
            }
        }
    });
    
    // test that the cumulative average function works as expected by comparing an aggregate average after 
    // N random observations
    test("test cumulativeAverageUpdate", () => {
        const eps = 0.001;
        // test that the cumulative average is equal to the usual average at step N
        const N = 100;
        let aggregateAverage = 0;
        let currentAverage = 0;
        for(let i = 0; i < N; ++i) {
            const x = Math.random();
            aggregateAverage += x;
            currentAverage = BOID.cumulativeAverageUpdate(currentAverage, i, x);
        }
        aggregateAverage /= N;
        expect(Math.abs(currentAverage - aggregateAverage) < eps).toBeTruthy();
    });

    // test cumulative average function for vec3
    test("test cumulativeAverageUpdateVec3", () => {
        const eps = 0.001;
        const N = 100;
        // test cumulative average on vec3
        let aggregateAverage: BOID.vec3 = {x: 0, y: 0, z: 0};
        let currentAverage: BOID.vec3 = {x: 0, y: 0, z: 0};
        for(let i = 0; i < N; ++i) {
            const rx = Math.random(), ry = Math.random(), rz = Math.random();
            const rvec: BOID.vec3 = {x: rx, y: ry, z: rz};
            aggregateAverage = BOID.plus(aggregateAverage, rvec);
            currentAverage = BOID.cumulativeAverageUpdateVec3(currentAverage, i, rvec);
        }
        aggregateAverage = BOID.scalarDivide(aggregateAverage, N);
        expect(BOID.length(BOID.minus(currentAverage,aggregateAverage)) < eps).toBeTruthy();
    });
});