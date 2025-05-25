const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');

// 캔버스 크기 설정
canvas.width = 400;
canvas.height = 600;

// 게임 설정 값
let score = 0;
const playerSize = 30;
const playerSpeed = 5;
const bulletSpeed = 7;
const enemySize = 25;
const enemySpeed = 2;
const enemies = []; // 적들을 담을 배열
const bullets = []; // 총알들을 담을 배열
let gameFrame = 0; // 게임 프레임을 세는 변수
let enemyInterval = 120; // 적 생성 간격 (프레임 수)

// 플레이어 객체
const player = {
    x: canvas.width / 2 - playerSize / 2,
    y: canvas.height - playerSize - 10,
    width: playerSize,
    height: playerSize,
    speed: playerSpeed
};

// 키 입력 상태
const keys = {};
window.addEventListener('keydown', function(e) {
    keys[e.key] = true;
});
window.addEventListener('keyup', function(e) {
    delete keys[e.key];
});

// 플레이어 그리기
function drawPlayer() {
    ctx.fillStyle = 'blue';
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

// 플레이어 업데이트 (움직임 처리)
function updatePlayer() {
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
}

// 총알 객체 생성
class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 5;
        this.height = 10;
        this.speed = bulletSpeed;
        this.markedForDeletion = false; // 삭제될 총알인지 표시
    }
    update() {
        this.y -= this.speed;
        if (this.y < 0) {
            this.markedForDeletion = true; // 화면 밖으로 나가면 삭제
        }
    }
    draw() {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

// 총알 발사 (스페이스바 눌렀을 때)
let canShoot = true;
window.addEventListener('keydown', function(e) {
    if (e.key === ' ' && canShoot) { // 스페이스바
        bullets.push(new Bullet(player.x + player.width / 2 - 2.5, player.y));
        canShoot = false; // 바로 연사되지 않도록 잠금
    }
});
window.addEventListener('keyup', function(e) {
     if (e.key === ' ') {
        canShoot = true; // 스페이스바를 떼면 다시 발사 가능
    }
});

// 적 객체 생성
class Enemy {
    constructor() {
        this.x = Math.random() * (canvas.width - enemySize); // 랜덤한 X 위치
        this.y = 0 - enemySize; // 화면 위쪽에서 시작
        this.width = enemySize;
        this.height = enemySize;
        this.speed = enemySpeed + Math.random() * 0.5; // 약간 랜덤한 속도
        this.markedForDeletion = false; // 삭제될 적군인지 표시
    }
    update() {
        this.y += this.speed;
        if (this.y > canvas.height) {
            this.markedForDeletion = true; // 화면 아래로 나가면 삭제
        }
    }
    draw() {
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

// 적 생성
function handleEnemies() {
    // 일정 프레임마다 새로운 적 생성
    if (gameFrame % enemyInterval === 0) {
        enemies.push(new Enemy());
    }

    // 적들 업데이트 및 그리기
    for (let i = 0; i < enemies.length; i++) {
        enemies[i].update();
        enemies[i].draw();
    }

    // 삭제될 적들 걸러내기
    enemies.filter(enemy => !enemy.markedForDeletion);
}

// 총알 처리 (업데이트 및 그리기)
function handleBullets() {
    for (let i = 0; i < bullets.length; i++) {
        bullets[i].update();
        bullets[i].draw();

        // 총알과 적 충돌 감지
        for (let j = 0; j < enemies.length; j++) {
            if (
                bullets[i] && enemies[j] &&
                bullets[i].x < enemies[j].x + enemies[j].width &&
                bullets[i].x + bullets[i].width > enemies[j].x &&
                bullets[i].y < enemies[j].y + enemies[j].height &&
                bullets[i].y + bullets[i].height > enemies[j].y
            ) {
                // 충돌 발생!
                enemies[j].markedForDeletion = true;
                bullets[i].markedForDeletion = true;
                score += 10; // 점수 증가
                scoreDisplay.textContent = '점수: ' + score; // 점수 표시 업데이트
            }
        }
    }

    // 삭제될 총알들 걸러내기 (충돌했거나 화면 밖으로 나간 총알)
    bullets.filter(bullet => !bullet.markedForDeletion);

    // 실제로 배열에서 제거 (이 부분은 좀 더 효율적으로 할 수 있지만 일단 간단하게)
    for (let i = bullets.length - 1; i >= 0; i--) {
        if (bullets[i].markedForDeletion) {
            bullets.splice(i, 1);
        }
    }
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i].markedForDeletion) {
            enemies.splice(i, 1);
        }
    }
}


// 게임 루프 (계속 반복되며 게임을 실행)
function gameLoop() {
    // 캔버스 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 요소들 업데이트 및 그리기
    updatePlayer();
    drawPlayer();
    handleBullets();
    handleEnemies();

    // 프레임 카운트 증가
    gameFrame++;

    // 다음 프레임 요청
    requestAnimationFrame(gameLoop);
}

// 게임 시작!
gameLoop();
