let scene, camera, renderer, controls;

let move = { forward: false, back: false, left: false, right: false };
let velocityY = 0;
let isOnGround = true;

let bullets = [];
let enemies = [];

let health = 100;
let kills = 0;

let canShoot = true;

/* GAME TIMER (1 minute) */
let gameTime = 60;  // 60 seconds match

/* START GAME */
function startGame() {
    document.getElementById("menu").style.display = "none";
    init();
    animate();
    startTimer();
}

/* INIT SCENE */
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    /* LIGHT */
    const light = new THREE.HemisphereLight(0xffffff, 0x444444);
    scene.add(light);

    /* FLOOR */
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    /* CONTROLS */
    controls = new THREE.PointerLockControls(camera, document.body);
    document.body.addEventListener("click", () => controls.lock());
    scene.add(controls.getObject());

    /* ENEMIES */
    spawnEnemies(8);

    /* INPUT */
    document.addEventListener("keydown", (e) => {
        if (e.key === "w") move.forward = true;
        if (e.key === "s") move.back = true;
        if (e.key === "a") move.left = true;
        if (e.key === "d") move.right = true;

        if (e.key === " " && isOnGround) {
            velocityY = 0.2;
            isOnGround = false;
        }
    });

    document.addEventListener("keyup", (e) => {
        if (e.key === "w") move.forward = false;
        if (e.key === "s") move.back = false;
        if (e.key === "a") move.left = false;
        if (e.key === "d") move.right = false;
    });

    /* SHOOT */
    document.addEventListener("click", shoot);
}

/* SPAWN ENEMIES */
function spawnEnemies(count) {
    for (let i = 0; i < count; i++) {
        createEnemy();
    }
}

function createEnemy() {
    let enemy = new THREE.Mesh(
        new THREE.BoxGeometry(1, 2, 1),
        new THREE.MeshStandardMaterial({ color: 0xff0000 })
    );
    enemy.position.set(Math.random() * 40 - 20, 1, Math.random() * 40 - 20);
    scene.add(enemy);
    enemies.push(enemy);
}

/* SHOOTING */
function shoot() {
    if (!canShoot) return;

    canShoot = false;
    setTimeout(() => canShoot = true, 200);

    let bullet = new THREE.Mesh(
        new THREE.SphereGeometry(0.1),
        new THREE.MeshBasicMaterial({ color: 0xffff00 })
    );
    bullet.position.copy(camera.position);

    let direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    bullet.velocity = direction.multiplyScalar(1.5);

    scene.add(bullet);
    bullets.push(bullet);
}

/* TIMER */
function startTimer() {
    let interval = setInterval(() => {
        gameTime--;

        updateUI();

        if (gameTime <= 0) {
            clearInterval(interval);
            endGame("⏰ Time Over!");
        }
    }, 1000);
}

/* UPDATE HUD */
function updateUI() {
    document.getElementById("health").innerText = Math.floor(health);
    document.getElementById("kills").innerText = kills;
    document.getElementById("timer").innerText = gameTime;
}

/* END GAME */
function endGame(text) {
    alert(text + " | Kills: " + kills);
    location.reload();
}

/* ANIMATE */
function animate() {
    requestAnimationFrame(animate);

    /* PLAYER MOVEMENT */
    let speed = 0.2;
    if (move.forward) controls.moveForward(speed);
    if (move.back) controls.moveForward(-speed);
    if (move.left) controls.moveRight(-speed);
    if (move.right) controls.moveRight(speed);

    /* GRAVITY */
    velocityY -= 0.01;
    camera.position.y += velocityY;

    if (camera.position.y < 1.6) {
        camera.position.y = 1.6;
        velocityY = 0;
        isOnGround = true;
    }

    /* BULLETS */
    bullets.forEach((b, i) => {
        b.position.add(b.velocity);

        /* HIT DETECTION */
        enemies.forEach((e, j) => {
            if (b.position.distanceTo(e.position) < 1) {
                scene.remove(e);
                enemies.splice(j, 1);
                kills++;
                createEnemy(); // respawn enemy
                scene.remove(b);
                bullets.splice(i, 1);
            }
        });
    });

    /* ENEMY AI */
    enemies.forEach(e => {
        let dir = new THREE.Vector3();
        dir.subVectors(camera.position, e.position).normalize();
        e.position.add(dir.multiplyScalar(0.03));

        /* DAMAGE PLAYER */
        if (e.position.distanceTo(camera.position) < 1.5) {
            health -= 0.2;
        }
    });

    /* UPDATE UI */
    updateUI();

    /* GAME OVER */
    if (health <= 0) {
        endGame("💀 You Died!");
    }

    renderer.render(scene, camera);
}