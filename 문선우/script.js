// Canvas 요소와 2D 렌더링 컨텍스트 가져오기
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 게임 변수 정의
let character = {
    x: 50, // 캐릭터의 x 좌표 (고정)
    y: 0, // 캐릭터의 y 좌표 (초기값, 이미지 로드 후 바닥에 배치)
    width: 50, // 캐릭터 이미지의 너비 (필요에 따라 조절)
    height: 50, // 캐릭터 이미지의 높이 (필요에 따라 조절)
    vy: 0, // 캐릭터의 y축 속도 (점프 및 중력 적용)
    isJumping: false // 캐릭터가 점프 중인지 여부
};

const gravity = 0.8; // 중력 가속도 값 (클수록 빨리 떨어짐)
const jumpStrength = -15; // 점프 시 적용되는 y축 초기 속도 (음수: 위로 이동)
let groundY = canvas.height - character.height; // 캐릭터가 서 있을 바닥의 y 좌표

let obstacles = []; // 현재 화면에 있는 장애물 목록
const obstacleWidth = 20; // 장애물의 너비
let obstacleSpeed = 5; // 장애물의 이동 속도 (클수록 빨라짐)
const obstacleInterval = 1500; // 새로운 장애물 생성 간격 (밀리초)
let lastObstacleTime = 0; // 마지막 장애물이 생성된 시간

let score = 0; // 게임 점수
let isGameOver = false; // 게임 오버 상태 여부

// 플레이어 캐릭터로 사용할 이미지 객체 생성
const playerImage = new Image();
playerImage.src = '1.png'; // 이미지 파일 경로 지정 (index.html과 같은 폴더에 있어야 함)

// 장애물 클래스 정의 (이전과 동일)
class Obstacle {
    constructor(x, y, width, height) {
        this.x = x; // 장애물의 x 좌표
        this.y = y; // 장애물의 y 좌표
        this.width = width; // 장애물의 너비
        this.height = height; // 장애물의 높이
    }

    // 장애물을 Canvas에 그리는 함수
    draw() {
        ctx.fillStyle = 'red'; // 장애물 색상
        ctx.fillRect(this.x, this.y, this.width, this.height); // 사각형으로 그림
    }

    // 장애물의 위치를 업데이트하는 함수 (왼쪽으로 이동)
    update() {
        this.x -= obstacleSpeed; // x 좌표를 감소시켜 왼쪽으로 이동
    }
}

// 키보드 입력 이벤트 리스너: 스페이스바 눌렀을 때 점프 (이전과 동일)
document.addEventListener('keydown', (e) => {
    // 스페이스바를 눌렀고, 캐릭터가 점프 중이 아니며, 게임 오버 상태가 아닐 때만 점프 가능
    if (e.code === 'Space' && !character.isJumping && !isGameOver) {
        character.vy = jumpStrength; // 점프 힘 적용
        character.isJumping = true; // 점프 상태로 변경
    }
});

// 게임 상태를 업데이트하는 메인 함수 (매 프레임 실행) - 이전과 거의 동일
function update(currentTime) {
    // 게임 오버 상태이면 업데이트 중단
    if (isGameOver) return;

    // 캐릭터 위치 업데이트 (중력 적용)
    character.vy += gravity; // y축 속도에 중력 가속도 더하기
    character.y += character.vy; // y축 속도만큼 y 좌표 이동

    // 캐릭터가 바닥에 닿았는지 확인 및 처리
    if (character.y >= groundY) {
        character.y = groundY; // 바닥 위치로 고정
        character.vy = 0; // y축 속도 0으로 만듦
        character.isJumping = false; // 점프 상태 해제
    }

    // 새로운 장애물 생성 로직 (이전과 동일)
    if (currentTime - lastObstacleTime > obstacleInterval) {
        const minHeight = 50; // 장애물의 최소 높이
        const maxHeight = canvas.height / 2; // 장애물의 최대 높이 (Canvas 높이의 절반)
        const obstacleHeight = Math.random() * (maxHeight - minHeight) + minHeight; // 랜덤 높이 설정
        // Canvas 오른쪽 끝에 새로운 장애물 생성
        obstacles.push(new Obstacle(canvas.width, canvas.height - obstacleHeight, obstacleWidth, obstacleHeight));
        lastObstacleTime = currentTime; // 마지막 생성 시간 업데이트
    }

    // 장애물 업데이트 및 충돌 판정, 화면 밖 장애물 제거 (이전과 거의 동일)
    for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i];
        obstacle.update(); // 장애물 위치 업데이트

        // 충돌 판정 (간단한 사각형 충돌 감지 - AABB) - 캐릭터 크기를 width/height 사용
        if (
            character.x < obstacle.x + obstacle.width &&
            character.x + character.width > obstacle.x && // character.size 대신 character.width 사용
            character.y < obstacle.y + obstacle.height &&
            character.y + character.height > obstacle.y // character.size 대신 character.height 사용
        ) {
            gameOver(); // 충돌 발생 시 게임 오버 함수 호출
            return; // 충돌 발생 시 게임 루프 중단
        }

        // 화면 왼쪽 밖으로 나간 장애물 제거
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(i, 1); // 배열에서 해당 장애물 제거
            i--; // 배열에서 요소를 제거했으므로 인덱스를 1 감소시켜 다음 요소 건너뛰지 않도록 함
        }
    }

    // 점수 업데이트: 매 프레임마다 점수 증가 (게임 진행 시간에 비례) (이전과 동일)
    score++;

    // 화면 다시 그리기
    draw();

    // 다음 프레임 애니메이션 요청
    requestAnimationFrame(update);
}

// Canvas에 게임 요소들을 그리는 함수 - 캐릭터 그리는 부분 수정
function draw() {
    // Canvas 전체를 지워서 이전 프레임 내용을 삭제
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 플레이어 캐릭터 그리기: 이미지 사용
    // 이미지가 로딩 완료되었는지 확인하고 drawImage 함수로 그림
    if (playerImage.complete && playerImage.naturalHeight !== 0) {
         ctx.drawImage(playerImage, character.x, character.y, character.width, character.height);
    } else {
         // 이미지가 로딩되지 않았다면 (예외적인 경우), 파란색 사각형으로 대체하여 그림
         // 이 부분은 이미지가 로드된 후 게임이 시작되므로 실제로 거의 실행되지 않습니다.
         ctx.fillStyle = 'blue';
         ctx.fillRect(character.x, character.y, character.width, character.height);
    }

    // 장애물 목록의 모든 장애물 그리기 (이전과 동일)
    for (const obstacle of obstacles) {
        obstacle.draw();
    }

    // 현재 점수 화면에 그리기 (이전과 동일)
    ctx.fillStyle = 'black'; // 점수 텍스트 색상
    ctx.font = '20px Arial'; // 점수 텍스트 글꼴 및 크기
    ctx.fillText(`Score: ${Math.floor(score / 10)}`, 10, 20); // 점수를 10으로 나누어 표시 (게임 속도에 비례)
}

// 게임 오버 처리 함수 (이전과 동일)
function gameOver() {
    isGameOver = true; // 게임 오버 상태로 변경

    // Canvas를 반투명하게 덮어서 게임 오버 화면 효과 적용
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // 검은색 반투명
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Canvas 전체를 덮음

    // 게임 오버 텍스트 표시
    ctx.fillStyle = 'white'; // 텍스트 색상
    ctx.font = '40px Arial'; // 텍스트 글꼴 및 크기
    ctx.textAlign = 'center'; // 텍스트 정렬 방식 (중앙)
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2); // Canvas 중앙에 텍스트 표시

    // 최종 점수 표시
    ctx.font = '20px Arial'; // 텍스트 글꼴 및 크기
    ctx.fillText(`Final Score: ${Math.floor(score / 10)}`, canvas.width / 2, canvas.height / 2 + 40); // 게임 오버 텍스트 아래에 표시
}

// 게임 시작 함수 - 이미지 로드 후 게임 시작하도록 수정
function startGame() {
     // 플레이어 이미지가 로딩 완료되면 실행될 콜백 함수
    playerImage.onload = () => {
        // 이미지 로드 완료 후 캐릭터의 초기 y 위치와 바닥 Y 좌표를 이미지 높이에 맞춰 설정
        character.y = canvas.height - character.height;
        groundY = canvas.height - character.height;

        lastObstacleTime = performance.now(); // 게임 시작 시간으로 마지막 장애물 생성 시간 초기화
        requestAnimationFrame(update); // 게임 루프 시작 (첫 번째 update 함수 호출)
    };

    // 플레이어 이미지 로드 실패 시 에러 처리
    playerImage.onerror = () => {
        console.error("플레이어 이미지 로드 실패: 1.png");
        // 이미지 로드 실패 시 게임 시작을 막거나 사용자에게 알림
        isGameOver = true; // 게임 시작을 막음
        ctx.fillStyle = 'red';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('이미지 로드 실패! (1.png)', canvas.width / 2, canvas.height / 2);
        ctx.font = '15px Arial';
        ctx.fillText('이미지 파일이 같은 폴더에 있는지 확인하세요.', canvas.width / 2, canvas.height / 2 + 30);
    };

    // 만약 이미지가 이미 브라우저 캐시에 있어 로드 완료 상태라면 바로 게임 시작
    // (onload 이벤트가 발생하지 않을 수 있으므로 이 검사를 추가. naturalHeight가 0이면 로드 실패한 이미지일 수 있음)
    if (playerImage.complete && playerImage.naturalHeight !== 0) {
         // 캐릭터 초기 위치 및 바닥 Y 좌표 설정
        character.y = canvas.height - character.height;
        groundY = canvas.height - character.height;
        lastObstacleTime = performance.now();
        requestAnimationFrame(update); // 게임 루프 시작
    }
    // 이미지가 로딩 중이거나 아직 로드되지 않았다면 onload 이벤트 대기
}


// 웹 페이지 로드가 완료되면 startGame 함수 호출
window.onload = startGame;
