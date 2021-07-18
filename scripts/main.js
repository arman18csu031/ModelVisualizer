import * as THREE from "./three/build/three.module.js";
import { OrbitControls } from "./three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "./three/examples/jsm/loaders/GLTFLoader.js";
import { GUI } from "./three/examples/jsm/libs/dat.gui.module.js";

let scene, camera, renderer;
let gui, guiExposure = null;

const params = {
    exposure: 1.0,
    toneMapping: 'ACESFilmic'
};

const toneMappingOptions = {
    None: THREE.NoToneMapping,
    ACESFilmic: THREE.ACESFilmicToneMapping
};

function init(){

//Scene Setup
scene = new THREE.Scene();
scene.background = new THREE.Color('white');

//Camera Setup
camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set( 0, 0, 5 );

//Renderer Setup
renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

renderer.toneMapping = toneMappingOptions[ params.toneMapping ];
renderer.toneMappingExposure = params.exposure;

renderer.outputEncoding = THREE.sRGBEncoding;

renderer.shadowMap.enabled = true;
//renderer.shadowMapType = THREE.PCFSoftShadowMap; //for anti aliasing

//Resize Event
window.addEventListener("resize", function () {
let aspectRatio = window.innerWidth / window.innerHeight;
camera.aspect = aspectRatio;
renderer.setSize(window.innerWidth, window.innerHeight);
camera.updateProjectionMatrix();
});

//Loading Models
const loader = new GLTFLoader();
loader.load("assets/mesh/Robot.glb", function (Model) {
    scene.add(Model.scene);
    Model.scene.position.set(0,-2,0);
    Model.scene.castShadow = true;
 });
 

var geo = new THREE.PlaneBufferGeometry(10, 10, 8, 8);
var mat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
var plane = new THREE.Mesh(geo, mat);
scene.add(plane);
plane.position.set(0, -2, 0);
plane.receiveShadow = true;
plane.rotateX( - Math.PI / 2);


//Lightning
var ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
scene.add(ambientLight);

const light = new THREE.DirectionalLight( 0xdfebff, 1 );
light.position.set( 50, 200, 100 );
light.position.multiplyScalar( 1.3 );

light.castShadow = true;

light.shadow.mapSize.width = 1024;
light.shadow.mapSize.height = 1024;

const d = 300;

light.shadow.camera.left = - d;
light.shadow.camera.right = d;
light.shadow.camera.top = d;
light.shadow.camera.bottom = - d;

light.shadow.camera.far = 1000;

scene.add( light );



//Orbital Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.addEventListener( 'change', render ); // use if there is no animation loop
controls.enableZoom = false;
controls.enablePan = false;
controls.target.set( 0, 0, - 0.2 );
controls.update();

render();

gui = new GUI();

gui.add( params, 'toneMapping', Object.keys( toneMappingOptions ) )

.onChange( function () {

updateGUI();

renderer.toneMapping = toneMappingOptions[ params.toneMapping ];
mesh.material.needsUpdate = true;
render();

} );
updateGUI();
gui.open();
}

function updateGUI() {
if ( guiExposure !== null ) {
gui.remove( guiExposure );
guiExposure = null;
}

if ( params.toneMapping !== 'None' ) {
guiExposure = gui.add( params, 'exposure', 0.2, 1.8 )
.onChange( function () {
renderer.toneMappingExposure = params.exposure;
render();
});
}
}

function render() {
    renderer.render( scene, camera );
}

//Call to Initializer Function  
init();



//********clipping planes********//
//const globalPlane = new THREE.PlaneGeometry( new THREE.Vector3( -1, 0, 0 ), 0.1 ); //horizontal clipping plane

// ***** Clipping setup (renderer): *****
/*const globalPlanes = [ globalPlane ],
Empty = Object.freeze( [] );
renderer.clippingPlanes = Empty; // GUI sets it to globalPlanes
renderer.localClippingEnabled = true;


// GUI

const gui = new GUI(),
folderGlobal = gui.addFolder( 'Global Clipping' ),
propsGlobal = {

    get 'Enabled'() {

        return renderer.clippingPlanes !== Empty;

    },
    set 'Enabled'( v ) {

       renderer.clippingPlanes = v ? globalPlanes : Empty;

    },

    get 'Plane'() {

        return globalPlane.constant;

    },
    set 'Plane'( v ) {

        globalPlane.constant = v;

    }

};
folderGlobal.add( propsGlobal, 'Enabled' );
folderGlobal.add( propsGlobal, 'Plane', -1, 3 );

//Matterial Array
let materialArray = [];
materialArray.push(new THREE.MeshBasicMaterial( { map: new THREE.TextureLoader().load("assets/skybox/blizzard_ft.jpg"), side: THREE.BackSide }));
materialArray.push(new THREE.MeshBasicMaterial( { map: new THREE.TextureLoader().load("assets/skybox/blizzard_bk.jpg"), side: THREE.BackSide }));
materialArray.push(new THREE.MeshBasicMaterial( { map: new THREE.TextureLoader().load("assets/skybox/blizzard_up.jpg"), side: THREE.BackSide }));
materialArray.push(new THREE.MeshBasicMaterial( { map: new THREE.TextureLoader().load("assets/skybox/blizzard_dn.jpg"), side: THREE.BackSide }));
materialArray.push(new THREE.MeshBasicMaterial( { map: new THREE.TextureLoader().load("assets/skybox/blizzard_rt.jpg"), side: THREE.BackSide }));
materialArray.push(new THREE.MeshBasicMaterial( { map: new THREE.TextureLoader().load("assets/skybox/blizzard_lf.jpg"), side: THREE.BackSide })); 

//Skybox
Skybox = new THREE.BoxGeometry(10, 10, 10);
skybox = new THREE.Mesh(Skybox, materialArray);
scene.add(skybox);*/
//Update Function
