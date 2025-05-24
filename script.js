// 캔버스 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 게임 변수
const gravity = 0.5; // 중력 가속도
const jumpStrength = -10; // 점프력 (음수 값으로 위로 이동)
let gameSpeed = 5; // 게임 속도 (장애물 이동 속도)
let score = 0;
const collisionPadding = -10;

// 플레이어 객체
const player = {
    x: 50, // 시작 x 위치
    y: canvas.height - 60, // 시작 y 위치 (바닥 위)
    width: 64,
    height: 64,
    velocityY: 0, // y축 속도
    isJumping: false,
    isGrounded: true // 바닥에 닿았는지 여부
};

// 캐릭터 이미지 로드
const playerImage = new Image();
playerImage.src = 'img/squirrel.png'; // 이미지 파일 경로

// 장애물 이미지
// **여기에 장애물 이미지 객체 생성 및 로드 코드를 추가합니다.**
const obstacleImages = []; // 장애물 이미지들을 담을 배열

const obstacleImage1 = new Image();
obstacleImage1.src = 'img/stone.png'; // 첫 번째 장애물 이미지 파일 경로
obstacleImages.push(obstacleImage1); // 배열에 추가

const obstacleImage2 = new Image();
obstacleImage2.src = 'img/stone2.png'; // 두 번째 장애물 이미지 파일 경로
obstacleImages.push(obstacleImage2); // 배열에 추가



function onObstacleImageLoad() {
    loadedImagesCount++;
    if (loadedImagesCount === totalObstacleImages) {
        console.log("모든 장애물 이미지 로드 완료!");
        // 모든 장애물 이미지가 로드된 후에 게임 루프를 시작하거나
        // 장애물을 생성하는 로직을 실행하는 것이 좋습니다.
    }
}

obstacleImage1.onload = onObstacleImageLoad;
obstacleImage2.onload = onObstacleImageLoad;

obstacleImage1.onerror = () => { console.error("1.png 로드 실패!"); };
obstacleImage2.onerror = () => { console.error("2.png 로드 실패!"); };

// 이미지가 로드될 때까지 기다리거나 로드 완료 시 실행할 함수 (선택 사항이지만 권장)
playerImage.onload = () => {
    console.log("캐릭터 이미지 로드 완료");
    // 이미지가 로드된 후 게임 시작 로직을 여기에 넣을 수 있습니다.
    // (예: requestAnimationFrame(update);)
};

playerImage.onerror = () => {
     console.error("캐릭터 이미지 로드 실패! 파일 경로를 확인하세요.");
};


// 장애물 배열
const obstacles = [];
let obstacleInterval = 2000; // ms, 장애물 생성 간격
let lastObstacleTime = 0;

// 점수 증가
let scoreInterval = setInterval(() => {
    score++;
}, 100); // 100ms 마다 점수 1 증가

// 그림 그리기 함수
function drawPlayer() {
    // ctx.fillStyle = 'blue';
    // ctx.fillRect(player.x, player.y, player.width, player.height);
    // 이미지가 로드되었는지 확인 후 그립니다.
    if (playerImage.complete && playerImage.naturalHeight !== 0) {
         ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
    } else {
        // 이미지가 로드되지 않았다면 임시로 네모를 그립니다. (선택 사항)
        ctx.fillStyle = 'gray';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
}

function drawObstacles() {
    // ctx.fillStyle = 'red';
    // obstacles.forEach(obstacle => {
    //     ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    // });
    obstacles.forEach(obstacle => {
        // 장애물 객체에 저장된 이미지가 있고 로드되었는지 확인 후 그립니다.
        if (obstacle.image && obstacle.image.complete && obstacle.image.naturalHeight !== 0) {
            ctx.drawImage(obstacle.image, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        } else {
            // 이미지가 로드되지 않았거나 없는 경우 임시로 사각형을 그립니다.
            ctx.fillStyle = 'red'; // 임시 색상
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
    });
}

function drawScore() {
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('점수: ' + score, 10, 25);
}

// 게임 업데이트 로직
function update(currentTime) {
    // 화면 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 이미지가 로드되지 않았다면 업데이트를 중단하거나 기다립니다.
    if (!playerImage.complete || playerImage.naturalHeight === 0) {
        requestAnimationFrame(update); // 이미지 로드될 때까지 기다림
        return;
    }

    // 플레이어 y 위치 업데이트 (중력 적용)
    player.velocityY += gravity;
    player.y += player.velocityY;

    // 바닥 체크 및 점프 상태 업데이트
    if (player.y + player.height >= canvas.height - 20) { // 바닥에서 약간 위 (발판 역할)
        player.y = canvas.height - 20 - player.height; // 바닥에 고정
        player.velocityY = 0; // 속도 초기화
        player.isGrounded = true;
        player.isJumping = false;
    } else {
        player.isGrounded = false;
    }

    // 장애물 생성
    if (currentTime - lastObstacleTime > obstacleInterval) {
        createObstacle();
        lastObstacleTime = currentTime;
        // 게임 진행에 따라 장애물 간격 줄이기 (선택 사항)
        // obstacleInterval = Math.max(500, obstacleInterval - 10);
    }

    // 장애물 위치 업데이트 및 제거
    for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i];
        obstacle.x -= gameSpeed; // 왼쪽으로 이동

        // 충돌 감지
        if (checkCollision(player, obstacle)) {
            // 게임 오버 처리 (예: 점수 초기화, 게임 중단)
            console.log("충돌! 게임 오버");
            clearInterval(scoreInterval); // 점수 증가 중단
            gameSpeed = 0; // 게임 속도 멈춤
            // 실제 게임에서는 게임 오버 화면 표시 등 추가 로직 필요
            return; // 충돌 발생 시 더 이상 업데이트하지 않음
        }

        // 화면 밖으로 나간 장애물 제거
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(i, 1);
            i--; // 배열에서 요소를 제거했으므로 인덱스 조정
        }
    }

    // 그림 그리기
    drawPlayer();
    drawObstacles();
    drawScore();

    // 다음 프레임 요청
    requestAnimationFrame(update);
}

// 장애물 생성 함수
function createObstacle() {
    // const obstacleWidth = 20 + Math.random() * 30; // 다양한 너비의 장애물
    // const obstacleHeight = 30 + Math.random() * 50; // 다양한 높이의 장애물
    // const obstacle = {
    //     x: canvas.width, // 화면 오른쪽에서 시작
    //     y: canvas.height - 20 - obstacleHeight, // 바닥에 위치
    //     width: obstacleWidth,
    //     height: obstacleHeight
    // };
    // obstacles.push(obstacle);
    // 사용할 장애물 이미지 무작위 선택
    const randomImage = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];

    // 이미지의 실제 크기를 사용하거나 원하는 크기로 설정합니다.
    // 여기서는 예시로 이미지의 실제 너비와 높이를 사용합니다.
    // 만약 고정된 크기를 원하시면 숫자로 지정하세요.
    const obstacleWidth = randomImage.naturalWidth || 50; // 이미지 로드 전에는 기본값 사용
    const obstacleHeight = randomImage.naturalHeight || 50; // 이미지 로드 전에는 기본값 사용

    const obstacle = {
        x: canvas.width,
        y: canvas.height - 20 - obstacleHeight,
        width: obstacleWidth,
        height: obstacleHeight,
        image: randomImage // **생성된 장애물 객체에 사용할 이미지를 할당합니다.**
    };
    obstacles.push(obstacle);
}

// 점프 함수
function jump() {
    if (player.isGrounded) {
        player.velocityY = jumpStrength; // 위쪽으로 속도 설정
        player.isJumping = true;
        player.isGrounded = false;
    }
}

// 충돌 감지 함수 (간단한 AABB 충돌)
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width + collisionPadding &&
           rect1.x + rect1.width > rect2.x - collisionPadding &&
           rect1.y < rect2.y + rect2.height + collisionPadding &&
           rect1.y + rect1.height > rect2.y - collisionPadding;
}

// 입력 처리 (스페이스바 누르면 점프)
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
        jump();
    }
});

// 게임 시작
requestAnimationFrame(update);

