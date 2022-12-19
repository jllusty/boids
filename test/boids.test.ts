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
    test("test create grid w/ N=1000 random points", () => {
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
    });
});