import * as THREE from 'three';




const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 100, 300);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
dirLight.position.set(15, 25, 15);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);


const floorGeo = new THREE.BoxGeometry(10, 0.5, 500);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.position.set(0, -0.25, -50);
floor.receiveShadow = true;
scene.add(floor);


const grassGeo = new THREE.BoxGeometry(50, 0.1, 500);
const grassMat = new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.9 });
const grass = new THREE.Mesh(grassGeo, grassMat);
grass.position.set(0, -0.5, -50);
grass.receiveShadow = true;
scene.add(grass);


function createTree(x, z) {
    
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, 1.5, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    scene.add(trunk);

    
    const foliageGeo = new THREE.ConeGeometry(2, 4, 8);
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.position.set(x, 4, z);
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    scene.add(foliage);
}


for (let i = 0; i < 30; i++) {
    createTree(-15, -i * 15);
    createTree(15, -i * 15);
    createTree(-22, -i * 15 - 7.5);
    createTree(22, -i * 15 - 7.5);
}


const playerGeo = new THREE.BoxGeometry(1, 2, 1);
const playerMat = new THREE.MeshStandardMaterial({ 
    color: 0x00ff00,
    roughness: 0.5,
    metalness: 0.3
});
const player = new THREE.Mesh(playerGeo, playerMat);
player.position.set(0, 1, 0);
player.castShadow = true;
player.receiveShadow = true;
scene.add(player);


const cabinGeo = new THREE.BoxGeometry(3, 3, 3);
const cabinMat = new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.7 });
const cabin = new THREE.Mesh(cabinGeo, cabinMat);
cabin.position.set(0, 1.5, -1000);
cabin.castShadow = true;
cabin.receiveShadow = true;
scene.add(cabin);


const roofGeo = new THREE.ConeGeometry(2.5, 2, 4);
const roofMat = new THREE.MeshStandardMaterial({ color: 0xDC143C });
const roof = new THREE.Mesh(roofGeo, roofMat);
roof.position.set(0, 4, -1000);
roof.castShadow = true;
scene.add(roof);


const particleCount = 1000;
const particleGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 100;
    positions[i + 1] = Math.random() * 50;
    positions[i + 2] = (Math.random() - 0.5) * 300;
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const particleMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.3
});

const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);


let currentLane = 0;
const laneWidth = 3;
const obstacles = [];
const checkpoints = [];
let isGameOver = false;
let won = false;
let score = 0;
let level = 1;
let distance = 0;
let speed = 0.3;
let spawnRate = 1500;


window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' && currentLane < 1) currentLane++;
    if (event.key === 'ArrowLeft' && currentLane > -1) currentLane--;
    player.position.x = currentLane * laneWidth;
});


function spawnObstacle() {
    if (isGameOver || won) return;
    
    const obsGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const obsMat = new THREE.MeshStandardMaterial({ 
        color: 0xff0000,
        roughness: 0.4,
        metalness: 0.5
    });
    const obstacle = new THREE.Mesh(obsGeo, obsMat);
    obstacle.castShadow = true;
    obstacle.receiveShadow = true;
    
    const randomLane = Math.floor(Math.random() * 3) - 1;
    obstacle.position.set(randomLane * laneWidth, 1, -100);
    
    scene.add(obstacle);
    obstacles.push(obstacle);
}

let spawnInterval = setInterval(spawnObstacle, spawnRate);


function createCheckpoint(z) {
    const checkGeo = new THREE.BoxGeometry(12, 0.1, 1);
    const checkMat = new THREE.MeshStandardMaterial({ 
        color: 0xFFFF00,
        emissive: 0xFFFF00,
        emissiveIntensity: 0.5
    });
    const checkpoint = new THREE.Mesh(checkGeo, checkMat);
    checkpoint.position.set(0, 0.3, z);
    checkpoint.receiveShadow = true;
    checkpoint.userData.passed = false;
    scene.add(checkpoint);
    checkpoints.push(checkpoint);
}


for (let i = 1; i < 15; i++) {
    createCheckpoint(-i * 20);
}


const playerBox = new THREE.Box3();
const obstacleBox = new THREE.Box3();
const checkpointBox = new THREE.Box3();
const cabinBox = new THREE.Box3();


let frameCount = 0;
function animate() {
    requestAnimationFrame(animate);
    frameCount++;
    
    if (isGameOver || won) {
        renderer.render(scene, camera);
        return;
    }

    
    if (frameCount % 2 === 0) {
        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 2] += speed * 0.5;
            if (positions[i + 2] > 20) {
                positions[i + 2] = -300;
            }
        }
        particles.geometry.attributes.position.needsUpdate = true;
    }
  
cabin.position.z += speed;
roof.position.z += speed;
cabinBox.setFromObject(cabin);

   
    playerBox.setFromObject(player);

   
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.position.z += speed;
        obs.rotation.x += 0.02;
        obs.rotation.y += 0.02;
        obstacleBox.setFromObject(obs);

        if (playerBox.intersectsBox(obstacleBox)) {
            isGameOver = true;
            document.getElementById('gameOverScreen').classList.add('show');
            document.getElementById('finalScore').textContent = score;
            document.getElementById('finalLevel').textContent = level;
            clearInterval(spawnInterval);
            return;
        }

        if (obs.position.z > 10) {
            scene.remove(obs);
            obs.geometry.dispose();
            obs.material.dispose();
            obstacles.splice(i, 1);
        }
    }

    
    for (let i = checkpoints.length - 1; i >= 0; i--) {
        const checkpoint = checkpoints[i];
        checkpoint.position.z += speed;
        checkpointBox.setFromObject(checkpoint);

       
        if (playerBox.intersectsBox(checkpointBox) && !checkpoint.userData.passed) {
            checkpoint.userData.passed = true;
            score += 10 * level;
            distance += 20;

            
            if (score % 100 === 0) {
                level++;
                speed += 0.05;
                spawnRate = Math.max(800, spawnRate - 50);
                clearInterval(spawnInterval);
                spawnInterval = setInterval(spawnObstacle, spawnRate);
            }

            updateUI();
        }

        
        if (checkpoint.position.z > 10) {
            scene.remove(checkpoint);
            checkpoint.geometry.dispose();
            checkpoint.material.dispose();
            checkpoints.splice(i, 1);
        }
    }

    
    const lastCheckpoint = checkpoints[checkpoints.length - 1];
    if (!lastCheckpoint || lastCheckpoint.position.z > -100) {
        const newCheckpointZ = lastCheckpoint ? lastCheckpoint.position.z - 20 : -20;
        createCheckpoint(newCheckpointZ);
    }
   
if (playerBox.intersectsBox(cabinBox)) {
  won = true;
  document.getElementById('winScreen').classList.add('show');
  document.getElementById('winScore').textContent = score;
  document.getElementById('winLevel').textContent = level;
  clearInterval(spawnInterval);
}


    camera.position.z = player.position.z + 10;
    camera.lookAt(player.position.x, 2, player.position.z - 5);

    renderer.render(scene, camera);
}

function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('distance').textContent = distance;
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
