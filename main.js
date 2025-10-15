// main.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.150.1/build/three.module.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';
let scene, camera, renderer, world, ballBody, ballMesh, groundBody, groundMesh;
let strokes = 0;
let isSwinging = false;
let power = 0;
let maxPower = 100;
let powerDirection = 1;
let gameStarted = false;
let ballInMotion = false;
let currentHole = 0;
let totalStrokes = 0;
let strokesPerHole = [];


const holes = [
    { tee: { x: 0, y: 0.2, z: 5 }, hole: { x: 0, y: -0.25, z: -20 }, par: 3 },
    { tee: { x: 10, y: 0.2, z: -20 }, hole: { x: 20, y: -0.25, z: 0 }, par: 4 },
    { tee: { x: 20, y: 0.2, z: 10 }, hole: { x: -10, y: -0.25, z: 0 }, par: 3 },
    { tee: { x: -10, y: 0.2, z: 10 }, hole: { x: 0, y: -0.25, z: -10 }, par: 5 }
];

let holeBodies = [];
let holeMeshes = [];
let flagMeshes = [];

let trees = [];
let waterBodies = [];
let waterMeshes = [];

let wind = new CANNON.Vec3(0.1, 0, 0);

let hitSound = new Audio('https://freesound.org/data/previews/276/276537_5006354-lq.mp3');
let holeSound = new Audio('https://freesound.org/data/previews/123/123456_1234567-lq.mp3');

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;


    const groundShape = new CANNON.Plane();
    groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);

    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);


    const ballShape = new CANNON.Sphere(0.2);
    ballBody = new CANNON.Body({ mass: 1 });
    ballBody.addShape(ballShape);
    ballBody.position.set(holes[0].tee.x, holes[0].tee.y, holes[0].tee.z);
    ballBody.angularDamping = 0.5;
    ballBody.linearDamping = 0.3;
    world.addBody(ballBody);

    const ballGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
    ballMesh.castShadow = true;
    scene.add(ballMesh);

 
    holes.forEach((holeData, index) => {
        const holeShape = new CANNON.Cylinder(0.3, 0.3, 0.5, 32);
        const holeBody = new CANNON.Body({ mass: 0, type: CANNON.Body.STATIC });
        holeBody.addShape(holeShape);
        holeBody.position.set(holeData.hole.x, holeData.hole.y, holeData.hole.z);
        world.addBody(holeBody);
        holeBodies.push(holeBody);

        const holeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 32);
        const holeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const holeMesh = new THREE.Mesh(holeGeometry, holeMaterial);
        holeMesh.position.copy(holeBody.position);
        scene.add(holeMesh);
        holeMeshes.push(holeMesh);

 
        const flagPoleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3, 32);
        const flagPoleMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
        const flagPole = new THREE.Mesh(flagPoleGeometry, flagPoleMaterial);
        flagPole.position.set(holeData.hole.x, holeData.hole.y + 1.75, holeData.hole.z);
        scene.add(flagPole);

        const flagGeometry = new THREE.PlaneGeometry(1, 0.5);
        const flagMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000, side: THREE.DoubleSide });
        const flagMesh = new THREE.Mesh(flagGeometry, flagMaterial);
        flagMesh.position.set(holeData.hole.x + 0.5, holeData.hole.y + 2.75, holeData.hole.z);
        flagMesh.rotation.y = Math.PI / 2;
        scene.add(flagMesh);
        flagMeshes.push(flagMesh);
    });

   
    for (let i = 0; i < 10; i++) {
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 32);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(Math.random() * 50 - 25, 1, Math.random() * 50 - 50);
        scene.add(trunk);

        const leavesGeometry = new THREE.SphereGeometry(1.5, 32, 32);
        const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.set(trunk.position.x, 3, trunk.position.z);
        scene.add(leaves);

        const treeShape = new CANNON.Box(new CANNON.Vec3(0.5, 2, 0.5));
        const treeBody = new CANNON.Body({ mass: 0 });
        treeBody.addShape(treeShape);
        treeBody.position.set(trunk.position.x, 1, trunk.position.z);
        world.addBody(treeBody);

        trees.push({ mesh: trunk, body: treeBody });
    }

    // Water Hazards - multiple
    const waterPositions = [
        { x: 5, y: -0.05, z: -10 },
        { x: 15, y: -0.05, z: -5 },
        { x: -5, y: -0.05, z: 5 }
    ];
    waterPositions.forEach(pos => {
        const waterShape = new CANNON.Box(new CANNON.Vec3(5, 0.1, 5));
        const waterBody = new CANNON.Body({ mass: 0, type: CANNON.Body.STATIC });
        waterBody.addShape(waterShape);
        waterBody.position.set(pos.x, pos.y, pos.z);
        world.addBody(waterBody);
        waterBodies.push(waterBody);

        const waterGeometry = new THREE.BoxGeometry(10, 0.2, 10);
        const waterMaterial = new THREE.MeshStandardMaterial({ color: 0x0000FF, transparent: true, opacity: 0.7 });
        const waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
        waterMesh.position.copy(waterBody.position);
        scene.add(waterMesh);
        waterMeshes.push(waterMesh);
    });

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('mousedown', onMouseDown, false);
    document.addEventListener('mouseup', onMouseUp, false);

    updateCurrentHoleUI();
    document.getElementById('story').style.display = 'block';
}

function startGame() {
    document.getElementById('story').style.display = 'none';
    gameStarted = true;
    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
    if (event.key === 'r' || event.key === 'R') {
        resetGame();
    }
}

function onMouseDown() {
    if (!ballInMotion && gameStarted && currentHole < holes.length) {
        isSwinging = true;
        document.getElementById('power-bar').style.display = 'block';
    }
}

function onMouseUp() {
    if (isSwinging) {
        isSwinging = false;
        hitBall();
        document.getElementById('power-bar').style.display = 'none';
        document.getElementById('power-fill').style.width = '0%';
    }
}

function hitBall() {
    strokes++;
    totalStrokes++;
    updateScore();

    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);
    direction.y = 0.2;
    direction.normalize();

    const force = power / 10;
    ballBody.applyImpulse(new CANNON.Vec3(direction.x * force, direction.y * force, direction.z * force), ballBody.position);

    hitSound.play();
    ballInMotion = true;
}

function updateScore() {
    document.getElementById('score').innerText = `Strokes: ${strokes} (Total: ${totalStrokes})`;
}

function updateCurrentHoleUI() {
    document.getElementById('current-hole').innerText = `Hole: ${currentHole + 1} / ${holes.length} (Par: ${holes[currentHole].par})`;
}

function isBallStopped() {
    const velocity = ballBody.velocity;
    return Math.abs(velocity.x) < 0.1 && Math.abs(velocity.y) < 0.1 && Math.abs(velocity.z) < 0.1;
}

function checkHole() {
    const ballPos = ballBody.position;
    const holePos = holeBodies[currentHole].position;
    const distance = Math.sqrt((ballPos.x - holePos.x)**2 + (ballPos.z - holePos.z)**2);
    if (distance < 0.5 && Math.abs(ballPos.y - holePos.y) < 0.5) {
        holeSound.play();
        strokesPerHole.push(strokes);
        document.getElementById('message').innerText = `Hole ${currentHole + 1} completed in ${strokes} strokes!`;
        currentHole++;
        if (currentHole < holes.length) {
            resetToNextHole();
        } else {
            gameOver();
        }
    }
}

function resetToNextHole() {
    strokes = 0;
    updateScore();
    updateCurrentHoleUI();
    resetBall();
    setTimeout(() => {
        document.getElementById('message').innerText = '';
    }, 3000);
}

function gameOver() {
    ballInMotion = false;
    let finalMessage = 'Course Completed! Total Strokes: ' + totalStrokes + '\n';
    let totalPar = 0;
    holes.forEach((hole, i) => {
        totalPar += hole.par;
        finalMessage += `Hole ${i+1}: ${strokesPerHole[i]} (Par ${hole.par})\n`;
    });
    finalMessage += `Score: ${totalStrokes - totalPar}`;
    document.getElementById('message').innerText = finalMessage;
}

function checkWater() {
    let inWater = false;
    waterBodies.forEach(waterBody => {
        const ballPos = ballBody.position;
        const waterPos = waterBody.position;
        if (Math.abs(ballPos.x - waterPos.x) < 5 && Math.abs(ballPos.z - waterPos.z) < 5 && ballPos.y < 0) {
            inWater = true;
        }
    });
    if (inWater) {
        document.getElementById('message').innerText = 'Water Hazard! Penalty.';
        strokes += 1;
        totalStrokes += 1;
        updateScore();
        resetBall();
    }
}

function resetBall() {
    const tee = holes[currentHole].tee;
    ballBody.position.set(tee.x, tee.y, tee.z);
    ballBody.velocity.set(0, 0, 0);
    ballBody.angularVelocity.set(0, 0, 0);
    ballInMotion = false;
}

function resetGame() {
    currentHole = 0;
    strokes = 0;
    totalStrokes = 0;
    strokesPerHole = [];
    updateScore();
    updateCurrentHoleUI();
    document.getElementById('message').innerText = '';
    resetBall();
}

function animate() {
    requestAnimationFrame(animate);

    world.step(1 / 60);

    ballMesh.position.copy(ballBody.position);
    ballMesh.quaternion.copy(ballBody.quaternion);

    if (ballInMotion) {
        ballBody.applyForce(wind, ballBody.position);
    }

    camera.position.set(ballBody.position.x, ballBody.position.y + 5, ballBody.position.z + 10);
    camera.lookAt(ballBody.position);

    if (isSwinging) {
        power += powerDirection;
        if (power >= maxPower || power <= 0) {
            powerDirection = -powerDirection;
        }
        document.getElementById('power-fill').style.width = `${(power / maxPower) * 100}%`;
    }

    if (ballInMotion && isBallStopped()) {
        ballInMotion = false;
    }

    checkHole();
    checkWater();

    renderer.render(scene, camera);
}

window.onload = init;

function addObstacle(x, y, z, width, height, depth) {
    const shape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2));
    const body = new CANNON.Body({ mass: 0 });
    body.addShape(shape);
    body.position.set(x, y, z);
    world.addBody(body);

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color: 0xA52A2A });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);

    return { body, mesh };
}

addObstacle(3, 1, -5, 1, 2, 1);
addObstacle(-3, 1, -15, 1, 2, 1);
addObstacle(15, 1, -10, 2, 3, 1);
addObstacle(5, 1, 5, 1, 2, 2);
addObstacle(-15, 1, 0, 1, 2, 1);

ballBody.postStep = () => {};
