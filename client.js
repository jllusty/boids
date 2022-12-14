"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var THREE = require("three");
var OrbitControls_1 = require("three/examples/jsm/controls/OrbitControls");
// Configure the camera to look at the Boids
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Configure the renderer to render the Boids
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
var controls = new OrbitControls_1.OrbitControls(camera, renderer.domElement);
// Each Boid is associated with a Mesh, though they should be separate objects
var geometry = new THREE.BoxGeometry(1, 1, 1);
var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
// Each boid has an independent position, orientation, and velocity
// Each boid can get its neighbors within a prescribed L-p norm
var cubes = [];
var numCubes = 16;
for (var i = 0; i < numCubes; i++) {
    cubes.push(new THREE.Mesh(geometry, material));
    cubes[i].position.x = 8.0 * Math.random() - 4.0;
    cubes[i].position.y = 8.0 * Math.random() - 4.0;
    cubes[i].position.z = 8.0 * Math.random() - 4.0;
    scene.add(cubes[i]);
}
// Camera could be a Boid, that would be fun
camera.position.z = 6;
controls.update();
// Update Perspective Matrix if Window is Resized
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
}
// How to animate the Boids
function animate() {
    requestAnimationFrame(animate);
    // Update Input / Controls
    controls.update();
    // Update the Boids
    for (var i = 0; i < cubes.length; i++) {
        cubes[i].rotation.x += 0.01;
        cubes[i].rotation.y += 0.01;
    }
    // Render the Boids
    renderer.render(scene, camera);
}
;
// Animate the Boids
animate();
