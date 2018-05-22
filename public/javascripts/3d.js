var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;

var GROUND_Y = 0;

var CONTAINER = null;
var MOVE_SPEED = 0.08;
var ROTATION_SPEED = 0.02;
var FOCAL_POINT = null;
var MOVE_SPEED_MULTIPLIER = 1;
var ROTATION_SPEED_MULTIPLIER = 1;

var currentKey = null;

var camera, scene, renderer;
var control, controls;
var ambientLight, pointLight;
var objLoader, mtlLoader;
var raycaster;
var controlsEnabled = false;
var objRegistry = {};
var textPanelRegistry = {};

var blocker = document.getElementById('blocker');
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var vertex = new THREE.Vector3();
var color = new THREE.Color();
var camDirection = new THREE.Vector3();
var camPosition = new THREE.Vector3();

var skyGeometry, skyMaterial, sky;
var testPanel = null;
var userWorldInfo = {
    id: 0,
    position: [],
    rotation: []
};
var messageLoad = {
    chat: '',
    worldChat: ''
};
var otherUsers = [];

function sendUserData(){
    socket.emit('userData', {userWorldInfo: userWorldInfo});
}

function handleIncomingData(){

}

// Parameters of the object to be rendered: dir, name, object, position, rotation, scale
function loadObject(arrayOfObjects = []) {
    let allTasks = arrayOfObjects.map(obj => {
        return new Promise(function(resolve, reject) {
            let objLoader = new THREE.OBJLoader();
            let mtlLoader = new THREE.MTLLoader();
            let ddsLoader = new THREE.DDSLoader();
            if (obj.object['mtl']) {
                mtlLoader.setPath(obj.dir).load(obj.object['mtl'], function(materials) {
                    materials.preload();
                    objLoader.setMaterials(materials).setPath(obj.dir).load(obj.object['obj'], function(loadedObject){
                        if (objRegistry[obj.name]) {
                            objRegistry[obj.name].push(loadedObject);
                        } else {
                            objRegistry[obj.name] = [loadedObject];
                        };
                        loadedObject.castShadow = true;
                        scene.add(loadedObject);
                        if (obj.position) {
                            loadedObject.position.set(obj.position[0], obj.position[1], obj.position[2]);
                        };
                        if (obj.rotation) {
                            loadedObject.rotation.set(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
                        };
                        if (obj.scale) {
                            loadedObject.scale.set(obj.scale, obj.scale, obj.scale);
                        };
                        resolve('Loaded ' + obj.name);
                    });
                });
            } else if (obj.object['obj']) {
                objLoader.setPath(obj.dir).load(obj.object['obj'], function(loadedObject){
                    if (objRegistry[obj.name]) {
                        objRegistry[obj.name].push(loadedObject);
                    } else {
                        objRegistry[obj.name] = [loadedObject];
                    };
                    loadedObject.castShadow = true;
                    scene.add(loadedObject);
                    if (obj.position) {
                        loadedObject.position.set(obj.position[0], obj.position[1], obj.position[2]);
                    };
                    if (obj.rotation) {
                        loadedObject.rotation.set(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
                    };
                    if (obj.scale) {
                        loadedObject.scale.set(obj.scale, obj.scale, obj.scale);
                    };
                    resolve('Loaded ' + obj.name);
                });
            };
        })
    })

    Promise.all(allTasks).then(function(values){
        console.log(values);
    })
    
};

function createTextPanel(sc, name, width, height, text, xPos, yPos, zPos) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    ctx.font = '40px Verdana';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillText(text, 10, 50);

    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    var material = new THREE.MeshBasicMaterial({
        opacity: 0.5,
        map: texture, 
        side: THREE.DoubleSide,
        premultipliedAlpha: true,
        transparent: true
    });

    var mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        material
    );

    mesh.position.set(xPos, yPos, zPos);
    sc.add(mesh);
    textPanelRegistry[name] = mesh;
    return mesh;
}

function updateSkyMaterial(imgurl){
    skyMaterial = new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture(imgurl),
        side: THREE.BackSide
    });
    sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);
};

function init3D() {
    // Initialize the DDS loader for importing objects later
    THREE.Loader.Handlers.add( /\.dds$/i, new THREE.DDSLoader() );

    // Setting the stage...
    scene = new THREE.Scene();

    // Camera...
    camera = new THREE.PerspectiveCamera(70, WIDTH /HEIGHT, 0.1, 5000);
    camera.position.set(11, GROUND_Y+0.5, 20);
    
    // Lights...
    ambientLight = new THREE.AmbientLight(0x404040, 4);
    pointLight = new THREE.PointLight(0xffffff, 0.5, 15);
    pointLight.position.set(0, 10, 0);
    pointLight.castShadow = true;
    pointLight.shadow.mapSize.width = 512;
    pointLight.shadow.mapSize.height = 512;
    pointLight.shadow.camera.near = 0.1;
    pointLight.shadow.camera.far = 5000;

    scene.add(ambientLight);
    scene.add(pointLight);
    
    // Action!
    // Well, we need a floor...   
    var geometry = new THREE.PlaneGeometry(1000, 1000, 16);
    var material = new THREE.MeshStandardMaterial({
        color: 0x001f00,
        side: THREE.DoubleSide,
        lights: true
    });
    
    var floor = new THREE.Mesh(geometry, material);
    floor.rotation.x = Math.PI/2;
    floor.position.set(0,GROUND_Y,0);
    floor.doubleSided = true;
    floor.receiveShadow = true;
    scene.add(floor);

    // a sky...
    skyGeometry = new THREE.SphereGeometry(2000, 20, 20);
    skyMaterial = new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture('/images/360_world.jpg'),
        side: THREE.BackSide
    });
    sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);
    
    // some volumetric fog...
    scene.fog = new THREE.Fog(0x999fff, 0.1, 7500);

    // Testing the models...
    loadObject([
        {
            dir: '/models/Chair/',
            name: 'chair',
            object: {
                "obj": "chair.obj",
                "mtl": "chair.mtl"
            },
            position: [0, GROUND_Y, 0],
            rotation: [0, Math.PI/4, 0],
            scale: 5
        },
        {
            dir: '/models/Sideboard/',
            name: 'sideboard',
            object: {
                "obj": "Buffet Moderne.obj",
                "mtl": "Buffet_Moderne.mtl"
            },
            position: [10, GROUND_Y, -10],
            rotation: [0, 0, 0],
            scale: 0.12
        },
        {
            dir: '/models/Ragdoll/',
            name: 'ragdoll',
            object: {
                "obj": "Muhammer.obj",
                "mtl": "Muhammer.mtl"
            },
            position: [20, GROUND_Y, 10],
            rotation: [0, 0, 0],
            scale: 2
        },
        {
            dir: '/models/psyduck/',
            name: 'psyduck',
            object: {
                "obj": "psyduck.obj",
                "mtl": "psyduck.mtl"
            },
            position: [10, GROUND_Y, 0],
            rotation: [-Math.PI/2, 0, 0],
            scale: 0.02
        },
        {
            dir: '/models/Dragon/',
            name: 'dragon',
            object: {
                "obj": "dragon.obj",
                "mtl": "dragon.mtl"
            },
            position: [30, GROUND_Y, -10],
            rotation: [0, 0, 0],
            scale: 2
        },
    ]);

    testPanel = createTextPanel(scene, 'testPanel', 20, 10, 'by CK', 0, GROUND_Y, 0);
    
    // Initialize the renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(WIDTH, HEIGHT);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    CONTAINER.appendChild(renderer.domElement);

    if (havePointerLock) {
        var element = document.body;
        // controlsEnabled = true;
        // controls.enabled = true;
        var pointerLockChange = function(event) {
            if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
                controlsEnabled = true;
                controls.enabled = true;
                blocker.style.display = 'none';
            } else {
                controlsEnabled = false;
                controls.enabled = false;
                blocker.style.display = 'block';
            }
        };
        var pointerLockError = function(event) {
            console.log('pointer lock error');
        };
        document.addEventListener('pointerlockchange', pointerLockChange, false)
        document.addEventListener('mozpointerlockchange', pointerLockChange, false)
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false)
        document.addEventListener('pointerlockerror', pointerLockError, false)
        document.addEventListener('mozpointerlockerror', pointerLockError, false)
        document.addEventListener('webkitpointerlockerror', pointerLockError, false)

        blocker.addEventListener('click', function(event) {
            element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
            element.requestPointerLock();
        }, false);
        
    }

    controls = new THREE.PointerLockControls(camera);
    scene.add(controls.getObject());
    var onKeyDown = function(event) {
        switch (event.keyCode) {
            case 38:
            case 87:
                moveForward = true;
                break;
            case 37:
            case 65:
                moveLeft = true;
                break;
            case 40:
            case 83:
                moveBackward = true;
                break;
            case 39:
            case 68:
                moveRight = true;
                break;
            case 32:
                if (canJump === true) {velocity.y += 250};
                canJump = false;
                break;
        }
    };
    var onKeyUp = function(event) {
        switch (event.keyCode) {
            case 38:
            case 87:
                moveForward = false;
                break;
            case 37:
            case 65:
                moveLeft = false;
                break;
            case 40:
            case 83:
                moveBackward = false;
                break;
            case 39:
            case 68:
                moveRight = false;
                break;
        }
    };
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);
}

function animate3D() {
    requestAnimationFrame(animate3D);
    testPanel.rotation.y += 0.01;
    if (controlsEnabled === true) {
        raycaster.ray.origin.copy(controls.getObject().position);
        raycaster.ray.origin.y -= 10;
        
        var delta = 16.7 / 1000;
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 100.0 * delta; // mass = 100

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveLeft) - Number(moveRight);
        direction.normalize();
        
        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

        controls.getObject().translateX(velocity.x * delta);
        controls.getObject().translateY(velocity.y * delta);
        controls.getObject().translateZ(velocity.z * delta);

        if (controls.getObject().position.y < 10) {
            velocity.y = 0;
            controls.getObject().position.y = 10;
            canJump = true;
        }
    }
    camera.getWorldDirection(camDirection);
    camera.getWorldPosition(camPosition);
    userWorldInfo.position = [camPosition.x, camPosition.y, camPosition.z]
    userWorldInfo.rotation = [camDirection.x, camDirection.y, camDirection.z]
    renderer.render(scene, camera);
}
