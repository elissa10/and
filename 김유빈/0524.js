const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d'); // 2D 그래픽을 그리기 위한 컨텍스트

// 게임 변수
let character;
let obstacles = [];
let gameSpeed = 7; // 게임 속도
let gravity = 0.15; // 중력
let jumpForce = -5; // 점프 힘
let groundLevel = canvas.height - 50; // 땅 높이
let score = 0;
let isGameOver = false;
let highScore = 0;

const HIGHSCORE_STORAGE_KEY = 'jumpGameHighScore';

// ** 이미지 로드를 위한 변수 추가 **
let playerImage = new Image(); // 이미지 객체 생성
playerImage.src = 'humanWalk.png'; // 이미지 파일 경로 지정

// ** 장애물 이미지 로드를 위한 변수 추가 **
let obstacleImage = new Image(); // 장애물 이미지 객체 생성
obstacleImage.src = 'dog.png'; // 장애물 이미지 파일 경로 지정

// ** 이미지 로드 완료를 기다리는 플래그 **
let isPlayerImageLoaded = false;
// ** 장애물 이미지 로드 완료를 기다리는 플래그 추가 **
let isObstacleImageLoaded = false;

function checkAllImagesLoaded() {
    if (isPlayerImageLoaded && isObstacleImageLoaded) {
        init(); // 모든 이미지 로드 후 게임 초기화
        gameLoop(); // 모든 이미지 로드 후 게임 루프 시작
    }
}

// 이미지 로드 완료 시 처리
playerImage.onload = () => {
    isPlayerImageLoaded = true; // 플레이어 이미지가 로드되었음을 표시
    checkAllImagesLoaded(); // 모든 이미지가 로드되었는지 확인
};

// ** 장애물 이미지 로드 완료 시 처리 추가 **
obstacleImage.onload = () => {
    isObstacleImageLoaded = true; // 장애물 이미지가 로드되었음을 표시
    checkAllImagesLoaded(); // 모든 이미지가 로드되었는지 확인
};

// ** 최고 점수 불러오기 함수 **
function loadHighScore() {
    const storedHighScore = localStorage.getItem(HIGHSCORE_STORAGE_KEY);
    if (storedHighScore !== null) { // 저장된 최고 점수가 있다면
        highScore = parseInt(storedHighScore, 10); // 숫자로 변환하여 저장
    } else { // 저장된 최고 점수가 없다면
        highScore = 0; // 0으로 초기화
    }
}

// ** 최고 점수 저장 함수 **
function saveHighScore() {
    if (score > highScore) { // 현재 점수가 최고 점수보다 높으면
        highScore = score; // 최고 점수 갱신
        localStorage.setItem(HIGHSCORE_STORAGE_KEY, highScore.toString()); // localStorage에 저장
        console.log('새로운 최고 점수 저장됨:', highScore); // 콘솔에 저장 메시지 출력
    }
}

// 캐릭터 객체
class Character {
    // ** 이미지 객체를 인자로 받도록 생성자 수정 **
    constructor(image) {
        this.image = image; // 캐릭터가 사용할 이미지
        this.x = 50; // 시작 X 위치
        this.y = groundLevel; // 시작 Y 위치 (땅 위)
        // ** 캐릭터 크기를 이미지 크기에 맞추거나 원하는 크기로 조정 **
        // 여기서는 예시로 기존 사각형 크기를 사용하거나 이미지 크기를 사용할 수 있습니다.
        // this.width = image.width;
        // this.height = image.height;
        this.width = 20; // 이전 사각형과 같은 너비 사용 (필요에 따라 조정하세요)
        this.height = 40; // 이전 사각형과 같은 높이 사용 (필요에 따라 조정하세요)

        this.velocityY = 0; // Y축 속도
        this.isJumping = false;
    }

    draw() {
        // ** 사각형 대신 이미지를 그립니다. **
        // drawImage(image, dx, dy, dWidth, dHeight) 형식 사용
        // 이미지를 그릴 때 캐릭터의 (x, y - height) 위치를 기준으로 그립니다.
        if (this.image && isPlayerImageLoaded) { // 이미지가 로드되었는지 확인
             ctx.drawImage(this.image, this.x, this.y - this.height, this.width, this.height);
        } else {
            // 이미지가 로드되지 않았다면 임시로 사각형을 그립니다.
            ctx.fillStyle = 'blue';
            ctx.fillRect(this.x, this.y - this.height, this.width, this.height);
        }
    }

    update() {
        // 중력 적용
        this.velocityY += gravity;
        this.y += this.velocityY;

        // 땅에 닿았는지 확인
        if (this.y > groundLevel) {
            this.y = groundLevel;
            this.velocityY = 0;
            this.isJumping = false; // 땅에 닿으면 점프 상태 해제
        }
    }

    jump() {
        if (!this.isJumping) {
            this.velocityY = jumpForce; // 위쪽 방향으로 속도 적용
            this.isJumping = true;
        }
    }
}

// 장애물 객체
class Obstacle {
    // ** 이미지 객체를 인자로 받도록 생성자 수정 **
    constructor(image) {
        this.image = image; // 장애물이 사용할 이미지
        // ** 장애물 크기를 이미지 크기에 맞추거나 원하는 크기로 조정 **
        // 여기서는 예시로 고정 크기를 사용하거나 이미지 크기를 사용할 수 있습니다.
        this.width = 30; // 장애물 너비 (이미지 크기에 맞게 조정하세요)
        this.height = 30; // 장애물 높이 (이미지 크기에 맞게 조정하세요)
        // ** 장애물 Y 위치를 땅 높이 기준으로 계산 **
        this.x = canvas.width; // 화면 오른쪽에서 시작
        this.y = groundLevel - this.height; // 땅 위에 위치

        this.speed = gameSpeed; // 게임 속도에 따라 이동
    }

    draw() {
        // ** 사각형 대신 이미지를 그립니다. **
        if (this.image && isObstacleImageLoaded) { // 이미지가 로드되었는지 확인
             ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            // 이미지가 로드되지 않았다면 임시로 사각형을 그립니다.
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    update() {
        this.x -= this.speed; // 왼쪽으로 이동
    }
}


// 게임 초기화
function init() {
    // ** 캐릭터 생성 시 로드된 이미지를 전달 **
    character = new Character(playerImage);
    obstacles = [];
    score = 0;
    isGameOver = false;
    gameSpeed = 5; // 게임 속도 초기화

    // 첫 장애물 생성 (게임 시작 후 바로 생성)
    if (!isGameOver) {
         generateObstacle(); // generateObstacle 함수는 setInterval로 장애물을 주기적으로 생성합니다.
     }
}

// 장애물 생성
// ** setInterval이 init() 호출 시 한 번만 설정되도록 수정 **
let obstacleInterval;
function generateObstacle() {
    // 기존 인터벌이 있다면 클리어하여 중복 실행 방지
    if (obstacleInterval) {
        clearInterval(obstacleInterval);
    }
    obstacleInterval = setInterval(() => {
        if (!isGameOver) {
             obstacles.push(new Obstacle(obstacleImage));
        }
    }, 2000); // 2초마다 장애물 생성 (간격 조절 가능)
}


// 충돌 판정 (이 부분은 이전과 동일합니다.)
function checkCollision(char, obs) {
    const charLeft = char.x;
    const charRight = char.x + char.width;
    const charTop = char.y - char.height;
    const charBottom = char.y;

    const obsLeft = obs.x;
    const obsRight = obs.x + obs.width;
    const obsTop = obs.y;
    const obsBottom = obs.y + obs.height;

     if (charRight > obsLeft && charLeft < obsRight && charBottom > obsTop && charTop < obsBottom) {
         return true; // 충돌 발생
     }
    return false; // 충돌 없음
}


// 게임 루프
function gameLoop() {
    if (isGameOver) {
        // ** 게임 오버 시 최고 점수 저장 시도 **
        saveHighScore(); // 현재 점수가 최고 점수보다 높으면 저장

        ctx.fillStyle = 'black';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        // ** 게임 오버 메시지에 최고 점수 함께 표시 **
        ctx.fillText('게임 오버! 점수: ' + score, canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillText('최고 점수: ' + highScore, canvas.width / 2, canvas.height / 2 + 20); // 최고 점수 표시
        ctx.font = '20px Arial';
        ctx.fillText('다시 시작하려면 아무 키나 누르세요.', canvas.width / 2, canvas.height / 2 + 70); // 메시지 위치 조정
        clearInterval(obstacleInterval);
        return;
    }

    if (isPlayerImageLoaded && isObstacleImageLoaded) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'green';
        ctx.fillRect(0, groundLevel, canvas.width, canvas.height - groundLevel);

        character.update();
        character.draw();

        for (let i = 0; i < obstacles.length; i++) {
            const obstacle = obstacles[i];
            obstacle.update();
            obstacle.draw();

            if (checkCollision(character, obstacle)) {
                isGameOver = true;
            }

            if (obstacle.x + obstacle.width < 0) {
                obstacles.splice(i, 1);
                i--;
            }
        }

        // 점수 증가
        score++;

        // ** 점수 및 최고 점수 표시 **
        ctx.fillStyle = 'black';
        ctx.font = '20px Arial';
        ctx.textAlign = 'left'; // 텍스트 정렬을 왼쪽으로 변경하여 겹치지 않게
        ctx.fillText('점수: ' + score, 10, 20); // 점수 위치
        ctx.fillText('최고 점수: ' + highScore, 10, 45); // 최고 점수 위치 (점수 밑에)

    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('이미지 로딩 중...', canvas.width / 2, canvas.height / 2);
    }

    requestAnimationFrame(gameLoop);
}

// 키 입력 처리 (점프)
document.addEventListener('keydown', (event) => {
    if (isGameOver) {
         // 게임 오버 상태에서 아무 키나 누르면 게임 다시 시작
         init();
         gameLoop(); // 새로운 게임 루프 시작
         return; // 게임 오버 상태에서는 점프 입력 무시
     }

    if (event.code === 'Space') { // 스페이스바를 누르면 점프
        character.jump();
    }
});

// 게임 시작은 playerImage.onload 에서 호출됩니다.
// init(); // 더 이상 여기서 바로 호출하지 않습니다.
// gameLoop(); // 더 이상 여기서 바로 호출하지 않습니다.

