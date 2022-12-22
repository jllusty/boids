import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { Boid, vec3, updateAllBoids } from './boid/boid';

// Configure the camera to look at the Boids
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

// Configure the renderer to render the Boids
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );

// Create the boids :^)
const numBoids = 512;
const width = 30.0;
let boids: Boid[] = [];
for(let i = 0; i < numBoids; i++) { 
    let randPoint = () => width * ( 2.0 * Math.random() - 1.0)
    // random position
	const px = randPoint();
	const py = randPoint();
	const pz = randPoint();
    const pos: vec3 = {x: px, y: py, z: pz};
    // random orientation (useless currently)
    const ox = 0; //randPoint();
    const oy = 0; //randPoint();
    const oz = 0; //randPoint();
    const ori: vec3 = {x: ox, y: oy, z: oz};
    // random velocity
    const vx = randPoint();
    const vy = randPoint();
    const vz = randPoint();
    const vel: vec3 = {x: vx, y: vy, z: vz};
    const boid: Boid = {label: i.toString(10), position: pos, orientation: ori, velocity: vel}
    boids.push(boid);
}

// Configure event listeners for keyboard presses
let spaceIsDown: boolean = false;
let shiftIsDown: boolean = false;
let manualPause: boolean = false;
document.addEventListener('keydown', (event) => {
    const name: string = event.key;
    const code: string = event.code;
    if(code === "Space") {
        spaceIsDown = true;
    }
    else if(code === "ShiftLeft") {
        shiftIsDown = true;
    }
    else if(code === "ShiftRight") {
        if(clock.running) {
            manualPause = true;
            console.log("stopping physics clock");
            clock.stop();
        }
        else {
            manualPause = false;
            console.log("restarting physics clock");
            clock.start();
        }
    }
}, false)
document.addEventListener('keyup', (event) => {
    const name: string = event.key;
    const code: string = event.code;
    if(code === "Space") {
        spaceIsDown = false;
    }
    else if(code === "ShiftLeft") {
        shiftIsDown = false;
    }
}, false)

// physics clock
const clock = new THREE.Clock(false);
// Do not update physics if no one is looking at the page
document.addEventListener("visibilitychange", (event) => {
    if (document.visibilityState == "visible") {
      if(!manualPause) {
        console.log("starting physics clock");
        clock.start();
      }
    } else {
      console.log("stopping physics clock");
      clock.stop();
    }
}, false);

// if double click, manually pause
let clickClock: THREE.Clock = new THREE.Clock();
let deltaTimeClick = 0;
clickClock.getDelta();
document.addEventListener("click", (event) => {
    deltaTimeClick = clickClock.getDelta();
    if(deltaTimeClick < 0.3) {
        if(clock.running) {
            manualPause = true;
            console.log("stopping physics clock");
            clock.stop();
        }
        else {
            manualPause = false;
            console.log("restarting physics clock");
            clock.start();
        }
    }
}, false);

// if 'C' hide physics constants table
document.addEventListener("keydown", (event) => {
    const key = event.key;
    const code = event.code;
    if(key === 'c') {
        let x = document.getElementById("info");
        if(x?.style.display === "none") {
            console.log('showing physics constants table');
            x!.style.display = "block";
        } else {
            console.log('hiding physics constants table');
            x!.style.display = "none";
        }
    }
});

// Each Boid is associated with a Mesh, though they should be separate objects
const geometry = new THREE.BoxGeometry(1.0, 1.0, 1.0);
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
// Each boid has an independent position, orientation, and velocity
// Each boid can get its neighbors within a prescribed L-p norm
let meshes: THREE.Mesh[] = [];
for(let i = 0; i < numBoids; i++) {
	meshes.push(new THREE.Mesh(geometry, material));
	scene.add( meshes[i] );
}

// limits of the playground mesh
// TODO: hideable
const playgroundGeometry = new THREE.SphereGeometry(100, 16, 12);
const wireframe = new THREE.WireframeGeometry(playgroundGeometry);
const line = new THREE.LineSegments(wireframe);
// scene.add(line);

// Camera could be a Boid, that would be fun
camera.position.x = 200.0;
camera.position.y = 100.0;
camera.position.z = 90.0;
controls.update();

// Update Perspective Matrix if Window is Resized
window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
}

// Globals
const INV_MAX_FPS = 1 / 60;
// Time between rendering frames for the Boids
let frameDelta = 0;

// Notes about what's next:
// 0 - Get the website pointing here
// 1 - Easier to control physical simulation
//     -> slowdown / speedup
// 2 - Sliders for the swarming parameters
// 3 - Collision avoidance and some obstacles
// 4 - Oriented boids (in the direction of their velocity)
// 5 - Skybox for easier viewing

// Start Physics Clock
clock.start();
console.log("starting physics clock");

// How to animate the Boids
function animate() {
	requestAnimationFrame( animate );

	// Update Input / Controls
	controls.update();

    // Update Physics if looking
    frameDelta += clock.getDelta();
    while (frameDelta >= INV_MAX_FPS) {
        // includes an integrative step
        updateAllBoids(boids, INV_MAX_FPS); 

        // pull all boids toward/away from a point (the origin, currently)
        // the idea here is to be able to conveniently control the position of the swarm(s)
        // currently one-off: pull boids 5% closer to the origin
        const pullScalar = 0.5;
        if(shiftIsDown && spaceIsDown) {
            for(var boid of boids) {
                boid.position.x += boid.position.x*pullScalar*INV_MAX_FPS;
                boid.position.y += boid.position.y*pullScalar*INV_MAX_FPS;
                boid.position.z += boid.position.z*pullScalar*INV_MAX_FPS;
            }
        }
        else if(spaceIsDown) {
            for(var boid of boids) {
                boid.position.x -= boid.position.x*pullScalar*INV_MAX_FPS;
                boid.position.y -= boid.position.y*pullScalar*INV_MAX_FPS;
                boid.position.z -= boid.position.z*pullScalar*INV_MAX_FPS;
            }
        }
        frameDelta -= INV_MAX_FPS;
    }

    // Associate the Boids with Cubes
	for(let i = 0; i < boids.length; i++) { 
        meshes[i].position.set(boids[i].position.x, boids[i].position.y, boids[i].position.z);
    }

	// Render the Cubes
	renderer.render( scene, camera );
};

// Animate the Boids
animate();
