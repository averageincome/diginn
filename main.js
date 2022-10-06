import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';



// Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xffffff );
scene.fog = new THREE.Fog( 'black', 1, 400);


const cameraGroup = new THREE.Group();
scene.add(cameraGroup);


const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 20000 );
camera.position.setZ(150);
camera.position.setY(-75);
scene.add(camera);
cameraGroup.add(camera);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  antialias: true,
  alpha: false,
});

//Window & Listener
document.body.appendChild(renderer.domElement);

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
//renderer.updateProjectionMatrix();
renderer.setSize(window.innerWidth, window.innerHeight);

document.addEventListener('mousemove', onDocumentMouseMove);
window.addEventListener('wheel', onMouseWheel, false);

let mouseX = 0;
let mouseY= 0;

let targetX = 0;
let targetY = 0;

const windowX = window.innerWidth / 2;
const windowY = window.innerHeight / 2;

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowX);
    mouseY = (event.clientY - windowY);
}

//Load Home GLTF
const gltfLoader = new GLTFLoader().setPath('public/models/');

gltfLoader.load('home.glb', function(gltf){

    var children = []
    gltf.scene.position.setY(-75);
    gltf.scene.scale.set(0.05, 0.05, 0.05);
    gltf.scene.traverse ( function ( child ){
        console.log(child);
        if (child.isMesh){
            children.push(child)
        }
    });

    children[1].material = new THREE.MeshStandardMaterial( {color:0xffffff});

    scene.add(gltf.scene);

    
    
});

/*
//Load GLTF
    const gltfLoader = new GLTFLoader().setPath('public/models/');

    gltfLoader.load('shapes.glb', function(gltf){

        var children = []

        gltf.scene.scale.set(0.05, 0.05, 0.05);
        gltf.scene.traverse ( function ( child ){
            console.log(child);
            if (child.isMesh){
                children.push(child)
            }
        });

        children[1].material = new THREE.MeshStandardMaterial( {color:0xffffff});

        scene.add(gltf.scene);

        
        
    });
*/

//Sky

    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);

    const skyUniforms = sky.material.uniforms;

    skyUniforms[ 'turbidity' ].value = 2;
    skyUniforms[ 'rayleigh' ].value = 5;
    skyUniforms[ 'mieCoefficient' ].value = 0.005;
    skyUniforms[ 'mieDirectionalG' ].value = .8;
    const parameters = {
        elevation: 2,
        azimuth: 180,
    };

//Sun
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const sun = new THREE.Vector3();

         // Defining the x, y and z value for our 3D Vector
         const phi = THREE.MathUtils.degToRad( 90 - parameters.elevation );
         const theta = THREE.MathUtils.degToRad( parameters.azimuth );

         sun.setFromSphericalCoords( 1, phi, theta );

    sun.x = Math.cos(phi);
    sun.y = .06;
    sun.z = Math.sin(phi) * Math.cos(theta);

    sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
    //water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();
    scene.environment = pmremGenerator.fromScene(sky).texture;
    scene.add(sun);


//Water

    const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );


    const water = new Water(
        waterGeometry,
        {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load( 'public/textures/waternormals.jpeg', function ( texture ) {

                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

            } ),
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
        
        }
    );

    water.rotation.x =- Math.PI / 2;
    scene.add(water);

    //const waterUniforms = water.material.uniforms;
//return water;


const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(10, 10, 10);

const ambientLight = new THREE.AmbientLight( 0x404040 );
scene.add(pointLight, ambientLight);

//const lightHelper = new THREE.PointLightHelper(pointLight);
//const gridHelper = new THREE.GridHelper(200, 50);
//scene.add(lightHelper, gridHelper);


//const controls = new OrbitControls(camera, renderer.domElement);


function addStar() {
    const geometry = new THREE.SphereGeometry(0.2, 24, 24);
    const material = new THREE.MeshStandardMaterial( {color:0xffffff});
    const star = new THREE.Mesh( geometry, material );

    const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread( 250) );

    star.position.set(x, y, z);
    scene.add(star);
}

Array(500).fill().forEach(addStar);


//Animate Stars and Mouse Interaction

const clock = new THREE.Clock();
let previousTime = 0


function onMouseWheel(ev) {
    ev.preventDefault();
camera.position.y += ev.deltaY / 5;
camera.position.clampScalar(-75, 2500);
}

function animate() {
    requestAnimationFrame(animate);


    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - previousTime;
    previousTime = elapsedTime;

    targetX = mouseX * .002;
    targetY = mouseY * .002;

    cameraGroup.position.x += (targetX - cameraGroup.position.x) * 50 * deltaTime;
    cameraGroup.position.y += (targetY - cameraGroup.position.y) * 50 * deltaTime;

    water.material.uniforms[ 'time' ].value += 0.3 / 60.0;

    const time = performance.now() * 0.001;

    //shapes.position.y = Math.sin( time ) * 2;
    //model.rotation.x = time * 0.3;
    //shapes.rotation.z = time * 0.3;

    /* Torus Rotation
    torus.rotation.x = 0.1 * elapsedTime;
    torus.rotation.y = 0.5 * elapsedTime;
    torus.rotation.z = 0.1 * elapsedTime;

    torus.rotation.x += 0.5 * (targetY - torus.rotation.x);
    torus.rotation.y += 0.5 * (targetX - torus.rotation.y);

    */


    //controls.update();
  
    renderer.render( scene, camera );
}


animate()