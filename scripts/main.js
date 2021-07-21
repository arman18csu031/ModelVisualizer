import * as THREE from "./three/build/three.module.js";
import { OrbitControls } from "./three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "./three/examples/jsm/loaders/GLTFLoader.js";
import { GUI } from "./three/examples/jsm/libs/dat.gui.module.js";
import { HorizontalBlurShader } from "./three/examples/jsm/shaders/HorizontalBlurShader.js";
import { VerticalBlurShader } from "./three/examples/jsm/shaders/VerticalBlurShader.js";

let scene, camera, renderer;
let gui;
const PLANE_HEIGHT = 2.5;
const PLANE_WIDTH = 2.5;
const CAMERA_HEIGHT = 0.3;
let shadowGroup, renderTarget, renderTargetBlur, shadowCamera, cameraHelper, depthMaterial, horizontalBlurMaterial, verticalBlurMaterial;
let plane, blurPlane, fillPlane;

const params = {
    exposure: 1.0,
    toneMapping: 'ACESFilmic'
};

const toneMappingOptions = {
    None: THREE.NoToneMapping,
    ACESFilmic: THREE.ACESFilmicToneMapping
};

const state = {
shadow: {
    blur: 3.5,
	darkness: 1,
},
plane: {
    color: '#ffffff',
    opacity: 1,
}
};

function init(){

//Scene Setup
scene = new THREE.Scene();
scene.background = new THREE.Color('white');

//Camera Setup
camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set( 0, 0, 5 );


//Loading Models
const loader = new GLTFLoader();
loader.load("assets/mesh/Astronaut.glb", function (Model) {
    const mesh = Model.scene.children[ 0 ];
    mesh.position.set(0,-2,0);
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    scene.add(mesh);
 });

shadowGroup = new THREE.Group();
shadowGroup.position.y = -2.1;
scene.add( shadowGroup );

renderTarget = new THREE.WebGLRenderTarget( 512, 512 );
renderTarget.texture.generateMipmaps = false;

renderTargetBlur = new THREE.WebGLRenderTarget( 512, 512 );
renderTargetBlur.texture.generateMipmaps = false;

const planeGeometry = new THREE.PlaneGeometry( PLANE_WIDTH, PLANE_HEIGHT ).rotateX( Math.PI / 2 );
const planeMaterial = new THREE.MeshBasicMaterial( {
        map: renderTarget.texture,
        opacity: state.shadow.opacity,
        transparent: true,
        depthWrite: false,
} );
plane = new THREE.Mesh( planeGeometry, planeMaterial );
plane.renderOrder = 1;
shadowGroup.add( plane );
		
plane.scale.y = - 1;
			
blurPlane = new THREE.Mesh( planeGeometry );
blurPlane.visible = false;
shadowGroup.add( blurPlane );
				
const fillPlaneMaterial = new THREE.MeshBasicMaterial( {
		color: state.plane.color,
		opacity: state.plane.opacity,
		transparent: true,
		depthWrite: false,
} );
fillPlane = new THREE.Mesh( planeGeometry, fillPlaneMaterial );
fillPlane.rotateX( Math.PI );
shadowGroup.add( fillPlane );

// the camera to render the depth material from
shadowCamera = new THREE.OrthographicCamera( - PLANE_WIDTH / 2, PLANE_WIDTH / 2, PLANE_HEIGHT / 2, - PLANE_HEIGHT / 2, 0, CAMERA_HEIGHT );
shadowCamera.rotation.x = Math.PI / 2; // get the camera to look up
shadowGroup.add( shadowCamera );

cameraHelper = new THREE.CameraHelper( shadowCamera );

depthMaterial = new THREE.MeshDepthMaterial();
depthMaterial.userData.darkness = { value: state.shadow.darkness };
depthMaterial.onBeforeCompile = function ( shader ) {

shader.uniforms.darkness = depthMaterial.userData.darkness;
shader.fragmentShader = /* glsl */`
						uniform float darkness;
						${shader.fragmentShader.replace(
					'gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );',
					'gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * darkness );'
				)}
					`;
};

depthMaterial.depthTest = false;
depthMaterial.depthWrite = false;

horizontalBlurMaterial = new THREE.ShaderMaterial( HorizontalBlurShader );
horizontalBlurMaterial.depthTest = false;

verticalBlurMaterial = new THREE.ShaderMaterial( VerticalBlurShader );
verticalBlurMaterial.depthTest = false;

//Lightning
var ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
scene.add(ambientLight);

gui = new GUI();
const shadowFolder = gui.addFolder( 'shadow' );
    shadowFolder.open();
const exposureFolder = gui.addFolder('exposure');
    exposureFolder.open();


shadowFolder.add( state.shadow, 'blur', 0, 15, 0.1 );
shadowFolder.add( state.shadow, 'darkness', 1, 5, 0.1 ).onChange( function () {
    depthMaterial.userData.darkness.value = state.shadow.darkness;
});

exposureFolder.add(params, 'exposure', 0.2, 1.8).onChange( function() {
    renderer.toneMappingExposure = params.exposure;
});

//Renderer Setup
renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
window.addEventListener( 'resize', onWindowResize );
document.body.appendChild( renderer.domElement );

renderer.toneMapping = toneMappingOptions[ params.toneMapping ];
renderer.toneMappingExposure = params.exposure;

renderer.outputEncoding = THREE.sRGBEncoding;

new OrbitControls( camera, renderer.domElement );

animate();
}

//Resize Event
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function blurShadow( amount ) {

    blurPlane.visible = true;

    // blur horizontally and draw in the renderTargetBlur
    blurPlane.material = horizontalBlurMaterial;
    blurPlane.material.uniforms.tDiffuse.value = renderTarget.texture;
    horizontalBlurMaterial.uniforms.h.value = amount * 1 / 256;

    renderer.setRenderTarget( renderTargetBlur );
    renderer.render( blurPlane, shadowCamera );

    // blur vertically and draw in the main renderTarget
    blurPlane.material = verticalBlurMaterial;
    blurPlane.material.uniforms.tDiffuse.value = renderTargetBlur.texture;
    verticalBlurMaterial.uniforms.v.value = amount * 1 / 256;

    renderer.setRenderTarget( renderTarget );
    renderer.render( blurPlane, shadowCamera );

    blurPlane.visible = false;

}

function animate( ) {

    requestAnimationFrame( animate );
   
    // remove the background
    const initialBackground = scene.background;
    scene.background = null;

    // force the depthMaterial to everything
    cameraHelper.visible = false;
    scene.overrideMaterial = depthMaterial;

    // render to the render target to get the depths
    renderer.setRenderTarget( renderTarget );
    renderer.render( scene, shadowCamera );

    // and reset the override material
    scene.overrideMaterial = null;
    cameraHelper.visible = true;

    blurShadow( state.shadow.blur );

    // a second pass to reduce the artifacts
    // (0.4 is the minimum blur amout so that the artifacts are gone)
    blurShadow( state.shadow.blur * 0.4 );

    // reset and render the normal scene
    renderer.setRenderTarget( null );
    scene.background = initialBackground;

    renderer.render( scene, camera );
    stats.update();

}

init();
        


        
            

