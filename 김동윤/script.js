const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');

// 게임 설정
const gravity = 0.8;
const jumpStrength = -15;
const obstacleSpeed = 5;
const obstacleInterval = 100; // 장애물 생성 간격 (프레임 수)
let frameCount = 0;
let score = 0;
let isGameOver = false;

// --- 캐릭터 설정 (이미지 적용 및 더블 점프 속성 추가) ---

// 이미지 파일 경로
const playerImageSrc = '1.png'; // 캐릭터 이미지 파일 이름
const playerImage = new Image();
playerImage.src = playerImageSrc;

const player = {
    x: 50,
    y: canvas.height - 50, // 초기 y 위치 (이미지 높이에 맞춰 임시 설정)
    width: 50,   // 캐릭터 너비 (원하는 크기로 설정)
    height: 50,  // 캐릭터 높이 (원하는 크기로 설정)
    dy: 0, // y축 속도
    isJumping: false, // 현재 점프 중인지 (공중에 떠 있는지)
    image: playerImage, // 이미지 객체
    isLoaded: false,     // 이미지가 로딩되었는지 확인하는 플래그

    // 더블 점프 관련 속성
    maxJumps: 2,       // 최대 점프 횟수 (기본 2번: 지상 점프 + 공중 점프 1번)
    jumpsLeft: 2       // 현재 남은 점프 횟수
};

// 캐릭터 이미지 로딩 완료 시 처리
player.image.onload = () => {
    player.isLoaded = true;
    // 이미지가 로딩된 후에 캐릭터의 최종 y 위치를 바닥에 맞춰줍니다.
    player.y = canvas.height - player.height;
    console.log("플레이어 이미지 로딩 완료:", playerImageSrc);
};

player.image.onerror = () => {
    console.error("플레이어 이미지 로딩 실패:", playerImageSrc);
    // 이미지가 로딩되지 않으면 게임을 진행할 수 없거나 기본 사각형으로 대체할 수 있습니다.
};


// --- 장애물 이미지 설정 ---

// 이미지 파일 경로
const obstacleImageSrc = 'chita.png'; // 장애물 이미지 파일 이름
const obstacleImage = new Image();
obstacleImage.src = obstacleImageSrc;

// 이미지가 로딩되었는지 확인하는 플래그
let obstacleImageLoaded = false;

// 장애물 이미지 로딩 완료 시 처리
obstacleImage.onload = () => {
    obstacleImageLoaded = true;
    console.log("장애물 이미지 로딩 완료:", obstacleImageSrc);
};

// 장애물 이미지 로딩 실패 시 처리 (선택 사항)
obstacleImage.onerror = () => {
    console.error("장애물 이미지 로딩 실패:", obstacleImageSrc);
    // 이미지가 로딩되지 않으면 장애물이 보이지 않게 되거나 기본 사각형으로 대체됩니다.
};


// 장애물 배열
let obstacles = [];

// --- 게임 함수 정의 ---

// 캐릭터 그리기 (이미지 또는 사각형)
function drawPlayer() {
    if (player.isLoaded) {
        ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
    } else {
        // 이미지가 로딩되기 전에는 빨간색 사각형으로 표시
        ctx.fillStyle = 'red';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
}

// 장애물 그리기 (이미지 또는 사각형)
function drawObstacles() {
    if (obstacleImageLoaded) {
        obstacles.forEach(obstacle => {
            // 각 장애물의 위치와 크기에 맞춰 이미지 그리기
            ctx.drawImage(obstacleImage, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });
    } else {
        // 이미지가 로딩되기 전에는 초록색 사각형으로 표시
        ctx.fillStyle = 'green';
        obstacles.forEach(obstacle => {
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });
    }
}

// 캐릭터 업데이트 (중력, 점프 적용, 점프 횟수 초기화 추가)
function updatePlayer() {
    // 중력 적용
    player.dy += gravity;
    player.y += player.dy;

    // 바닥에 닿았을 때
    const groundLevel = canvas.height - player.height; // 캐릭터 높이를 사용
    if (player.y >= groundLevel) {
        player.y = groundLevel; // 바닥에 고정
        player.dy = 0; // 수직 속도 0
        player.isJumping = false; // 땅에 닿았으므로 점프 중 상태 해제
        // 땅에 닿으면 남은 점프 횟수 초기화
        player.jumpsLeft = player.maxJumps;
    } else {
         // 땅에 닿지 않았으면 공중에 떠 있는 상태
         player.isJumping = true;
    }
}

// 장애물 업데이트 및 생성
function updateObstacles() {
    // 장애물 이동
    obstacles.forEach(obstacle => {
        obstacle.x -= obstacleSpeed;
    });

    // 화면 밖으로 나간 장애물 제거
    obstacles = obstacles.filter(obstacle => obstacle.x + obstacle.width > 0);

    // 일정 간격마다 새로운 장애물 생성
    if (frameCount % obstacleInterval === 0) {
        createObstacle();
    }
}

// 새로운 장애물 생성
function createObstacle() {
    // 장애물 크기 범위 설정
    const minWidth = 30;
    const maxWidth = 70;
    const width = minWidth + Math.random() * (maxWidth - minWidth);
    const minHeight = 50;
    const maxHeight = 80;
    const height = minHeight + Math.random() * (maxHeight - minHeight);
    const x = canvas.width;
    const y = canvas.height - height; // 바닥에 닿도록 y 위치 계산

    obstacles.push({ x, y, width, height });
}

// 충돌 감지
function checkCollision() {
    obstacles.forEach(obstacle => {
        // AABB (Axis-Aligned Bounding Box) 충돌 감지
        if (player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height && // 캐릭터 높이 사용
            player.y + player.height > obstacle.y) { // 캐릭터 높이 사용
            // 충돌 발생
            gameOver();
        }
    });
}

// 점수 업데이트
function updateScore() {
    score++;
    scoreDisplay.textContent = `점수: ${score}`;
}

// 게임 오버
function gameOver() {
    isGameOver = true;
    ctx.font = '48px sans-serif';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText('게임 오버!', canvas.width / 2, canvas.height / 2);
    ctx.font = '24px sans-serif';
    ctx.fillText('새로고침하여 다시 시작', canvas.width / 2, canvas.height / 2 + 40);
}

// 점프 함수 (더블 점프 로직 적용)
function jump() {
    // 남은 점프 횟수가 0보다 클 때만 점프 가능
    if (player.jumpsLeft > 0) {
        player.dy = jumpStrength; // 위로 속도 적용
        player.isJumping = true; // 점프 중 상태로 변경
        player.jumpsLeft--; // 점프 횟수 차감
        console.log("점프! 남은 횟수:", player.jumpsLeft); // 확인용 로그
    }
}

// 키보드 이벤트 리스너 (스페이스바 누르면 점프)
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && !isGameOver) {
        jump(); // 스페이스바 누르면 jump 함수 호출
    }
});

// --- 게임 루프 ---

function gameLoop() {
    if (isGameOver) {
        return; // 게임 오버 상태면 루프 중지
    }

    // 화면 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 요소들 업데이트
    updatePlayer();
    updateObstacles();
    checkCollision();
    // 점수는 게임 오버가 아닐 때만 증가
    if (!isGameOver) {
       updateScore();
    }

    // 요소들 그리기
    drawPlayer();
    drawObstacles();

    // 다음 프레임 요청
    frameCount++;
    requestAnimationFrame(gameLoop);
}

// 게임 시작
createObstacle(); // 첫 장애물 생성
gameLoop(); // 게임 루프 시작
