// Canvas 및 Context 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800; // 캔버스 너비
canvas.height = 400; // 캔버스 높이

// 게임 설정 변수
let gravity = 0.6; // 중력 가속도
let jumpStrength = -12; // 점프 힘 (음수여야 위로 이동)
let score = 0; // 점수
let gameSpeed = 5; // 게임 시작 속도
const initialGameSpeed = 5; // 초기 게임 속도 저장
let gameFrame = 0; // 게임 프레임 (점수 계산 및 장애물 생성에 사용)
let gameOver = false; // 게임 오버 상태

// --- 무적 기능 관련 변수 ---
let invincibilityDuration = 3000; // 무적 지속 시간 (3초)
let invincibilityStartTime = 0; // 무적 시작 시간 (timestamp)
const invincibilityCost = 20; // 무적 사용에 필요한 점수

// --- 쿨타임 관련 변수 (10초 유지) ---
let isInvincibilityCooldown = false; // 무적 스킬 쿨타임 중인지 여부
let invincibilityCooldownDuration = 10000; // 무적 스킬 쿨타임 시간 (10초)
let invincibilityCooldownStartTime = 0; // 무적 스킬 쿨타임 시작 시간 (timestamp)
// --- 쿨타임 변수 끝 ---

// --- 게임 속도 증가 관련 변수 ---
const speedIncreaseRate = 0.0005; // 게임 프레임당 속도 증가량
const maxGameSpeed = 15; // 최대 게임 속도
// --- 속도 증가 변수 끝 ---

// --- 장애물 생성 빈도 관련 변수 ---
const initialObstacleInterval = 80; // 시작 시 장애물 생성 주기 (프레임 단위)
const minObstacleInterval = 40; // 최소 장애물 생성 주기
const scoreThresholdForFasterObstacles = 30; // 이 점수마다 장애물 생성 주기 감소
const obstacleIntervalDecreaseAmount = 2; // 점수 임계값 도달 시 생성 주기 감소량
// --- 장애물 빈도 변수 끝 ---

// --- 플레이어 HP 관련 변수 ---
const initialPlayerHp = 3; // 플레이어의 초기 HP
// --- 추가 끝 ---

// --- 파티클 시스템 설정 객체 추가 ---
const particleSettings = {
    blood: {
        count: 15, // 충돌 시 생성될 파티클 개수
        colors: ['rgba(255, 0, 0, 0.8)', 'rgba(220, 0, 0, 0.7)', 'rgba(180, 0, 0, 0.6)'], // 피 색상
        sizeRange: [1, 6], // 파티클 크기 범위 (min, max)
        vxRange: [-5, 5], // x축 속도 범위
        vyRange: [-10, -5], // y축 속도 범위 (위쪽으로 튀어오름)
        gravityScale: 0.5, // 중력 영향 정도
        lifetime: 60 // 생명주기 (프레임)
    },
    wind: {
        count: 8, // 점프 시 생성될 파티클 개수
        colors: ['rgba(255, 255, 255, 0.5)', 'rgba(220, 220, 220, 0.4)', 'rgba(180, 180, 180, 0.3)'], // 바람 색상
        sizeRange: [2, 4], // 파티클 크기 범위
        vxRange: [-3, 3], // x축 속도 범위 (약간 옆으로 퍼짐)
        vyRange: [4, 8], // y축 속도 범위 (아래쪽으로 퍼짐)
        gravityScale: 0, // 중력 영향 없음
        lifetime: 30 // 생명주기 (프레임)
    }
};
// --- 파티클 설정 끝 ---

let particles = []; // 활성화된 모든 파티클을 저장할 배열


// 캐릭터 객체 (플레이어) (jump 메서드 수정)
const player = {
    x: 50,
    y: canvas.height - 50,
    width: 40,
    height: 40,
    dy: 0,
    image: null,

    maxJumps: 2,
    currentJumps: 0,
    isInvincible: false,
    hp: initialPlayerHp,

    draw() {
        if (this.image) {
            ctx.globalAlpha = this.isInvincible ? 0.6 : 1;
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            ctx.globalAlpha = 1;
        } else {
            ctx.fillStyle = this.isInvincible ? 'rgba(255, 0, 0, 0.5)' : 'red';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    },

    update() {
        this.dy += gravity;
        this.y += this.dy;

        if (this.y + this.height >= canvas.height) {
            this.y = canvas.height - this.height;
            this.dy = 0;
            this.currentJumps = 0;
        }
    },

    jump() {
        if (this.currentJumps < this.maxJumps) {
            this.dy = jumpStrength;
            this.currentJumps++;

            // --- 점프 시 바람 파티클 생성 ---
            // 플레이어 발 아래 중앙 위치에서 파티클 생성
            createParticles('wind', this.x + this.width / 2, this.y + this.height);
            // --- 파티클 생성 끝 ---
        }
    },

    activateInvincibility() {
        if (!gameOver && !this.isInvincible && score >= invincibilityCost && !isInvincibilityCooldown) {
            score -= invincibilityCost;
            this.isInvincible = true;
            invincibilityStartTime = Date.now();

            isInvincibilityCooldown = true;
            invincibilityCooldownStartTime = Date.now();

            console.log('Invincibility activated! Score reduced by ' + invincibilityCost + '. Cooldown started.');
        } else if (score < invincibilityCost) {
            console.log('Not enough score (' + score + ') to activate invincibility (' + invincibilityCost + ' required)!');
        } else if (this.isInvincible) {
             console.log('Invincibility is already active!');
        } else if (isInvincibilityCooldown) {
             const remainingCooldown = Math.ceil((invincibilityCooldownStartTime + invincibilityCooldownDuration - Date.now()) / 1000);
             console.log('Invincibility is on cooldown. Remaining: ' + remainingCooldown + 's');
        }
    }
};

// --- 일반 파티클 클래스 (설정 객체 받도록 수정) ---
class Particle {
    constructor(x, y, settings) {
        this.x = x;
        this.y = y;
        // 설정 객체에서 크기 범위 가져와 무작위 크기 설정
        this.size = Math.random() * (settings.sizeRange[1] - settings.sizeRange[0]) + settings.sizeRange[0];
        // 설정 객체에서 색상 배열 가져와 무작위 색상 선택
        this.color = settings.colors[Math.floor(Math.random() * settings.colors.length)];
        // 설정 객체에서 속도 범위 가져와 무작위 속도 설정
        this.vx = Math.random() * (settings.vxRange[1] - settings.vxRange[0]) + settings.vxRange[0];
        this.vy = Math.random() * (settings.vyRange[1] - settings.vyRange[0]) + settings.vyRange[0];
        this.gravityScale = settings.gravityScale; // 중력 영향 정도 설정
        this.maxLifetime = settings.lifetime; // 최대 생명주기 설정
        this.lifetime = 0; // 현재 생명주기
        this.alpha = 1; // 초기 투명도
    }

    update() {
        this.vy += gravity * this.gravityScale; // 중력 영향 적용
        this.x += this.vx;
        this.y += this.vy;
        this.lifetime++;
        this.alpha = 1 - this.lifetime / this.maxLifetime; // 생명주기에 따라 투명도 감소 (페이드 아웃)
    }

    draw() {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1; // 투명도 초기화
    }
}

// 특정 타입의 파티클을 생성하는 일반 함수
function createParticles(type, x, y) {
    const settings = particleSettings[type]; // 타입에 맞는 설정 가져오기
    if (!settings) {
        console.error("Unknown particle type:", type);
        return;
    }

    for (let i = 0; i < settings.count; i++) {
        // 설정에 따라 파티클 생성
        particles.push(new Particle(x, y, settings));
    }
}

// 모든 파티클 업데이트 및 제거 함수 (수정 없음)
function handleParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].lifetime >= particles[i].maxLifetime || particles[i].alpha <= 0) {
             particles.splice(i, 1);
        }
    }
}

// 모든 파티클 그리기 함수 (수정 없음)
function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
        particles[i].draw();
    }
}
// --- 파티클 시스템 관련 수정 끝 ---


// 장애물 클래스 (기존 코드와 동일)
class Obstacle {
    constructor() {
        this.width = Math.random() * 30 + 20;
        this.height = Math.random() * 60 + 30;
        this.x = canvas.width;
        this.y = canvas.height - this.height;
        this.speed = gameSpeed;
        this.image = obstacleImage;
    }

    draw() {
         if (this.image) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
         } else {
             ctx.fillStyle = 'green';
             ctx.fillRect(this.x, this.y, this.width, this.height);
         }
    }

    update() {
        this.x -= this.speed;
    }
}

let obstacles = []; // 장애물 배열

// --- 이미지 로딩 및 게임 시작 관련 (기존 코드와 동일) ---
let imagesLoaded = 0;
const totalImagesToLoad = 2;

const playerImage = new Image();
playerImage.src = '1.png';
playerImage.onload = function() {
    player.image = playerImage;
    imagesLoaded++;
    checkAllImagesLoaded();
};
playerImage.onerror = function() {
    console.error('Failed to load player image: 1.png');
    imagesLoaded++;
    checkAllImagesLoaded();
};

const obstacleImage = new Image();
obstacleImage.src = '2.png';
obstacleImage.onload = function() {
    console.log('Obstacle image loaded.');
    imagesLoaded++;
    checkAllImagesLoaded();
};
obstacleImage.onerror = function() {
    console.error('Failed to load obstacle image: 2.png');
    imagesLoaded++;
    checkAllImagesLoaded();
};

function checkAllImagesLoaded() {
    if (imagesLoaded === totalImagesToLoad) {
        console.log('All necessary images loaded. Starting game.');
        animate();
    }
}
// --- 이미지 로딩 및 게임 시작 관련 끝 ---

// 장애물 생성 주기 계산 함수 (수정 없음)
function calculateObstacleInterval(currentScore) {
    const decreaseSteps = Math.floor(currentScore / scoreThresholdForFasterObstacles);
    let interval = initialObstacleInterval - (decreaseSteps * obstacleIntervalDecreaseAmount);
    if (interval < minObstacleInterval) {
        interval = minObstacleInterval;
    }
    return interval;
}


// 장애물 생성 함수 (수정 없음)
function handleObstacles() {
    const currentObstacleInterval = calculateObstacleInterval(score);

    if (gameFrame % currentObstacleInterval === 0) {
        obstacles.unshift(new Obstacle());
    }

    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].update();
        obstacles[i].draw();
    }

    if (obstacles.length > 0 && obstacles[0].x < -obstacles[0].width) {
        obstacles.shift();
    }
}

// 충돌 감지 함수 (기존 코드와 동일)
function detectCollision(player, obstacle) {
    const playerRight = player.x + player.width;
    const playerBottom = player.y + player.height;
    const obstacleRight = obstacle.x + obstacle.width;
    const obstacleBottom = obstacle.y + obstacle.height;

    return !(playerRight < obstacle.x ||
             player.x > obstacleRight ||
             playerBottom < obstacle.y ||
             player.y > obstacleBottom);
}

// 게임 오버 처리 함수 (수정 없음)
function handleGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('게임 오버', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '25px Arial';
    ctx.fillText('최종 점수: ' + score, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText('스페이스바를 눌러 다시 시작', canvas.width / 2, canvas.height / 2 + 60);
}

// 게임 상태 초기화 함수 (파티클 배열 초기화 추가) (수정 없음)
function resetGame() {
    score = 0;
    gameSpeed = initialGameSpeed;
    gameFrame = 0;
    obstacles = [];
    particles = []; // 파티클 배열 초기화

    player.y = canvas.height - player.height;
    player.dy = 0;
    player.currentJumps = 0;
    player.isInvincible = false;
    player.hp = initialPlayerHp; // 플레이어 HP 초기화

    isInvincibilityCooldown = false;
    invincibilityStartTime = 0;
    invincibilityCooldownStartTime = 0;

    gameOver = false;

    console.log('Game reset. Starting new game.');
    animate(); // 게임 루프 다시 시작
}


// 점수 표시 함수 (수정 없음)
function handleScore() {
    if (!gameOver) {
        gameFrame++;
        score = Math.floor(gameFrame / 10);
    }

    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('점수: ' + score, 10, 25);

    ctx.fillStyle = 'red';
    ctx.font = '20px Arial';
    ctx.fillText('HP: ' + player.hp, 10, 50);

    if (player.isInvincible) {
        const remainingTime = Math.ceil((invincibilityStartTime + invincibilityDuration - Date.now()) / 1000);
        ctx.fillStyle = 'blue';
        ctx.font = '20px Arial';
        ctx.fillText('무적: ' + remainingTime + 's', 10, 75);
    }

    if (isInvincibilityCooldown) {
        const remainingCooldown = Math.ceil((invincibilityCooldownStartTime + invincibilityCooldownDuration - Date.now()) / 1000);
        ctx.fillStyle = 'orange';
        ctx.font = '20px Arial';
        const cooldownTextY = player.isInvincible ? 100 : 75;
        ctx.fillText('쿨타임: ' + remainingCooldown + 's', 10, cooldownTextY);
    }
}

// 게임 루프 함수 (파티클 업데이트/그리기 로직 유지)
function animate() {
    if (gameOver) {
        handleGameOver();
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 무적 시간 관리
    if (player.isInvincible) {
        const elapsedTime = Date.now() - invincibilityStartTime;
        if (elapsedTime >= invincibilityDuration) {
            player.isInvincible = false;
            console.log('Invincibility ended.');
        }
    }

    // 쿨타임 시간 관리
    if (isInvincibilityCooldown) {
        const elapsedTime = Date.now() - invincibilityCooldownStartTime;
        if (elapsedTime >= invincibilityCooldownDuration) {
            isInvincibilityCooldown = false;
            console.log('Invincibility cooldown ended.');
        }
    }

    // 게임 속도 증가
    if (!gameOver) {
        gameSpeed += speedIncreaseRate;
        if (gameSpeed > maxGameSpeed) {
            gameSpeed = maxGameSpeed;
        }
    }

    player.update();
    player.draw();

    handleObstacles();

    // --- 충돌 감지 및 플레이어 HP 처리, 피 파티클 생성 ---
    for (let i = obstacles.length - 1; i >= 0; i--) {
        if (detectCollision(player, obstacles[i])) {
            if (!player.isInvincible) {
                 console.log('Collision! Player HP reduced.');
                player.hp--; // 플레이어 HP 감소

                // 충돌 시 피 파티클 생성
                const collisionX = player.x + player.width / 2;
                const collisionY = player.y + player.height / 2;
                createParticles('blood', collisionX, collisionY); // 'blood' 타입 파티클 생성

                obstacles.splice(i, 1); // 충돌한 장애물 제거

                if (player.hp <= 0) {
                    gameOver = true;
                    console.log('Player HP is 0. Game Over.');
                }
            } else {
                 console.log('Invincible collision! Passed through obstacle.');
                 // 무적 상태 충돌 시 장애물을 제거하고 싶다면 여기에 obstacles.splice(i, 1); 추가
            }
        }
        if (gameOver) break; // 게임 오버되면 충돌 체크 중단
    }
    // --- 충돌 감지 수정 끝 ---

    // --- 모든 파티클 업데이트 및 그리기 ---
    handleParticles(); // 파티클 상태 업데이트 및 제거
    drawParticles(); // 파티클 그리기
    // --- 파티클 관련 끝 ---


    if (!gameOver) {
       handleScore();
       requestAnimationFrame(animate);
    } else {
        handleGameOver();
    }
}

// 이벤트 리스너 (수정 없음)
window.addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
        if (gameOver) {
            resetGame();
        } else {
            player.jump(); // 점프 시 player.jump() 메서드 호출 (내부에 파티클 생성 로직 포함)
        }
    } else if (event.code === 'KeyE') {
        player.activateInvincibility();
    }
});

// 게임 시작은 모든 이미지가 로드된 후 checkAllImagesLoaded 함수에서 호출됩니다.
