const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas 요소 및 Context 가져오기 실패 시 오류 출력
if (!canvas) {
    console.error('오류: id가 "gameCanvas"인 요소를 HTML에서 찾을 수 없습니다.');
} else if (!ctx) {
    console.error('오류: Canvas 2D context를 가져올 수 없습니다.');
} else {
    console.log('Canvas와 Context가 성공적으로 준비되었습니다.');
}

const scoreBoard = document.getElementById('scoreBoard');
// 다시 시작 버튼 요소 가져오기
const restartButton = document.getElementById('restartButton');

// 버튼 요소를 찾지 못했다면 오류 출력
if (!restartButton) {
    console.error('오류: id가 "restartButton"인 요소를 HTML에서 찾을 수 없습니다.');
} else {
    console.log('다시 시작 버튼이 성공적으로 준비되었습니다.');
}


// 캔버스 크기 설정
canvas.width = 800;
canvas.height = 400;

// 게임 변수
let gameSpeed = 5; // 게임 속도 (장애물 이동 속도 등)
let score = 0; // 현재 점수
let isGameOver = false; // 게임 오버 상태
let isRestartable = false; // 게임 오버 후 재시작 가능한 상태인지 (버튼 활성화 상태)

// --- 이미지 설정 ---
// 플레이어 이미지 객체
const playerImage = new Image();
playerImage.src = '1.png'; // 플레이어 이미지 파일 경로. HTML과 같은 폴더에 있어야 합니다.
let isPlayerImageLoaded = false; // 플레이어 이미지가 로드되었는지 확인 플래그

// 장애물 이미지 객체
const obstacleImage = new Image();
obstacleImage.src = '2.png'; // 장애물 이미지 파일 경로. HTML과 같은 폴더에 있어야 합니다.
let isObstacleImageLoaded = false; // 장애물 이미지가 로드되었는지 확인 플래그

// 이미지 로딩 완료 및 오류 처리
let imagesToLoad = 2; // 로드할 이미지 개수
let imagesLoadedCount = 0; // 로드 완료된(성공 또는 실패) 이미지 개수

// 이미지 로드 완료 시마다 호출될 함수
function imageLoadComplete() {
    imagesLoadedCount++;
    console.log(`이미지 로드 완료: ${imagesLoadedCount}/${imagesToLoad}`);
    // 모든 이미지 로드 시도(성공/실패 무관)가 끝나면 게임 시작
    if (imagesLoadedCount === imagesToLoad) {
        console.log('모든 이미지 로드 시도 완료. 게임 루프 시작.');
        // 모든 이미지가 로드되었거나 로드 실패가 확인되면 게임 루프 시작
        if (!isGameOver) { // 초기 상태에서만 게임 시작
             gameLoop();
        }
    }
}

// 플레이어 이미지 로드 이벤트 리스너
playerImage.onload = () => {
    isPlayerImageLoaded = true;
    console.log('플레이어 이미지 로드 성공: 1.png');
    imageLoadComplete();
};
playerImage.onerror = () => {
    console.error('플레이어 이미지 로드 실패: 1.png - 파일 경로를 확인하세요.');
    isPlayerImageLoaded = false; // 로드 실패했음을 표시
    imageLoadComplete(); // 실패해도 로드 시도 완료로 간주
};

// 장애물 이미지 로드 이벤트 리스너
obstacleImage.onload = () => {
    isObstacleImageLoaded = true;
    console.log('장애물 이미지 로드 성공: 2.png');
    imageLoadComplete();
};
obstacleImage.onerror = () => {
    console.error('장애물 이미지 로드 실패: 2.png - 파일 경로를 확인하세요.');
    isObstacleImageLoaded = false; // 로드 실패했음을 표시
    imageLoadComplete(); // 실패해도 로드 시도 완료로 간주
};


// --- 플레이어 설정 ---
const player = {
    x: 50, // 시작 x 위치
    y: canvas.height - 50 - 10, // 바닥 바로 위에 서 있는 초기 y 위치 (높이 50 + 바닥 여유 10)
    width: 50, // 플레이어 너비 (이미지 크기에 맞게 조절 가능)
    height: 50, // 플레이어 높이 (이미지 크기에 맞게 조절 가능)
    color: 'red', // 이미지 로드 실패 시 기본 색상
    velocityY: 0, // y축 속도
    gravity: 0.8, // 중력 값
    groundY: canvas.height - 10 - 50, // 캐릭터가 서 있을 바닥의 y 좌표 (바닥선 두께 10 + 플레이어 높이 50)

    // --- 점프 및 비행 관련 변수 ---
    jumpPower: 18, // 점프 시 초기 속도 (위로 솟구치는 힘)
    flyVelocity: 5, // 비행 중 유지할 상승 속도 (음수 값일수록 위로 빠르게, 양수 값일수록 아래로)
    jumpCharges: 2, // 현재 남은 점프/비행 시작 가능 횟수 (최대 2)
    maxJumpCharges: 2, // 최대 점프/비행 허용 횟수 (지상 점프 1회 + 공중 점프/비행 시작 1회)
    isHoldingSpace: false, // 스페이스바를 누르고 있는지 여부
    isFlying: false, // 현재 비행 중인지 여부 (스페이스바를 누르고 있어 비행 상태가 유지되는 경우)
    currentFlightFrames: 0, // 현재 비행 지속 프레임 수
    maxFlightFrames: 300 // 최대 비행 허용 프레임 수 (약 5초 @ 60fps 가정)
};

// --- 장애물 설정 ---
let obstacles = []; // 장애물 목록을 저장할 배열 (재할당 가능하도록 let으로 선언)
let obstacleSpeed = gameSpeed; // 장애물 이동 속도는 게임 속도와 동일하게 시작
let obstacleInterval = 1200; // 새 장애물 생성 간격 (밀리초)
let lastObstacleTime = 0; // 마지막 장애물이 생성된 시간 (Timestamp)

// --- 키보드 이벤트 리스너 (점프/비행) ---
document.addEventListener('keydown', (event) => {
    // 게임 오버 상태일 때는 점프/비행 입력 무시
    if (isGameOver) return;

    if (event.code === 'Space') {
        // 스페이스바가 처음 눌렸을 때만 isHoldingSpace를 true로 설정 (연속 점프/비행 방지)
        if (!player.isHoldingSpace) {
             player.isHoldingSpace = true;

             // 플레이어가 바닥에 있는지 확인 (약간의 오차 범위 허용)
             const tolerance = 5;
             const isOnGround = player.y >= player.groundY - tolerance && player.y <= canvas.height - 10 + tolerance; // 바닥선 위/아래 약간 범위


             // 바닥에 있을 때 점프 (첫 번째 점프 기회 사용)
             // isHoldingSpace는 이미 위에서 true로 설정됨
             if (isOnGround && player.jumpCharges > 0) {
                 player.velocityY = -player.jumpPower; // 점프 속도 적용 (음수 = 위로)
                 player.jumpCharges--; // 점프 기회 1회 소모
                 player.isFlying = false; // 지상 점프는 비행 아님
                 player.currentFlightFrames = 0; // 비행 프레임 초기화

                 console.log(`Ground jump. Charges left: ${player.jumpCharges}`);
             }
             // 공중에 있을 때 두 번째 점프 또는 비행 시작 시도
             else if (!isOnGround && !player.isFlying && player.jumpCharges > 0) {
                 player.jumpCharges--; // 점프 기회 1회 소모
                 player.isFlying = true; // 비행 상태 시작
                 player.currentFlightFrames = 0; // 비행 프레임 시작 시점 초기화
                 player.velocityY = -player.flyVelocity; // 비행을 위한 초기/유지 속도 적용 (작은 음수)

                 console.log(`Air jump/Start flight. Charges left: ${player.jumpCharges}`);
             }
        }
    }
});

document.addEventListener('keyup', (event) => {
    if (event.code === 'Space') {
        player.isHoldingSpace = false; // 스페이스바 떼는 상태로 설정
        // 스페이스바를 떼면 현재 비행 중이었다면 비행 중지 상태로 전환
        if (player.isFlying) {
            player.isFlying = false;
            console.log('Stop flying (keyup)');
        }
    }
});


// --- 다시 시작 버튼 클릭 이벤트 리스너 ---
// 버튼 요소가 제대로 가져와졌을 때만 이벤트 리스너 추가
if (restartButton) {
    restartButton.addEventListener('click', () => {
        console.log('다시 시작 버튼 클릭됨.');
        if (isRestartable) {
            console.log('재시작 가능한 상태. 게임 재시작 함수 호출.');
            restartGame(); // 게임 재시작 함수 호출
        } else {
             console.log('재시작 불가능한 상태. 버튼 클릭 무시.');
        }
    });
}
// ----------------------------------------


// --- 그리기 함수 ---
// 배경 그리기 함수 (간단하게 색으로)
function drawBackground() {
    ctx.fillStyle = '#87CEEB'; // 하늘색
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 바닥선 그리기
    ctx.fillStyle = '#A0522D'; // 갈색
    ctx.fillRect(0, canvas.height - 10, canvas.width, 10);
}

// 플레이어 그리기 함수
function drawPlayer() {
     // 이미지가 로드되었거나 이미지 로드에 실패해서 기본 도형을 그려야 하는 경우 (로딩 완료 시점 확인)
    if (isPlayerImageLoaded || (!isPlayerImageLoaded && imagesLoadedCount === imagesToLoad)) {
        if (isPlayerImageLoaded) {
            // 이미지가 로드되었으면 이미지를 그립니다.
            // ctx.drawImage(image, dx, dy, dw, dh)
            ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
        } else {
            // 이미지가 로드되지 않았으면 기본 사각형을 그립니다.
            ctx.fillStyle = player.color;
            ctx.fillRect(player.x, player.y, player.width, player.height);
        }
    }
    // 이미지가 아직 로드 중이면 (실패든 성공이든 완료되지 않았으면) 아무것도 그리지 않음
}

// 장애물 그리기 함수
function drawObstacle(obstacle) {
     // 이미지가 로드되었거나 이미지 로드에 실패해서 기본 도형을 그려야 하는 경우 (로딩 완료 시점 확인)
     if (isObstacleImageLoaded || (!isObstacleImageLoaded && imagesLoadedCount === imagesToLoad)) {
        if (isObstacleImageLoaded) {
            // 이미지가 로드되었으면 이미지를 그립니다.
            ctx.drawImage(obstacleImage, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        } else {
            // 이미지가 로드되지 않았으면 기본 사각형을 그립니다.
            ctx.fillStyle = obstacle.color;
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
     }
     // 이미지가 아직 로드 중이면 아무것도 그리지 않음
}


// --- 게임 로직 함수 ---

// 새 장애물 생성 함수
function createObstacle() {
    const obstacleWidth = 20 + Math.random() * 30; // 20 ~ 50 사이의 랜덤 너비
    const obstacleHeight = 30 + Math.random() * 50; // 30 ~ 80 사이의 랜덤 높이
    // 바닥 선 위에 정확히 생성
    const obstacleY = canvas.height - 10 - obstacleHeight;
    const obstacle = {
        x: canvas.width, // 캔버스 오른쪽 끝에서 시작
        y: obstacleY,
        width: obstacleWidth,
        height: obstacleHeight,
        color: 'green', // 이미지 로드 실패 시 기본 색상
        passed: false // 플레이어가 이 장애물을 통과했는지 여부 (점수 계산용)
    };
    obstacles.push(obstacle); // 장애물 배열에 추가
     console.log('장애물 생성. 현재 장애물 수:', obstacles.length); // 디버깅용
}

// 게임 상태 업데이트 함수 (움직임, 충돌, 점수 등)
function updateGame() {
    if (isGameOver) return; // 게임 오버 상태면 업데이트 중지

    // 플레이어가 바닥에 있는지 확인
    // velocityY가 양수일 때 (하강 중일 때) 바닥 y 좌표 근처에 오면 착지 판정
    const tolerance = 5; // 바닥에서 약간 떠 있어도 바닥으로 간주할 오차
    const isOnGround = player.y >= player.groundY - tolerance && player.velocityY >= 0;


    // --- 플레이어 위치 업데이트 및 비행/중력 처리 ---
    if (isOnGround) { // 바닥에 닿았거나 바닥 근처에서 하강/멈춤 상태일 때
        // 바닥에 있을 때: 위치 고정, 속도 0, 점프 횟수 초기화, 비행 상태 해제
        player.y = player.groundY; // 바닥에 고정
        player.velocityY = 0; // 수직 속도 0
        player.jumpCharges = player.maxJumpCharges; // 점프 기회 모두 회복
        player.isFlying = false; // 비행 상태 해제
        player.currentFlightFrames = 0; // 비행 프레임 초기화
        // isHoldingSpace는 keyup에서 관리됨

    } else { // 공중에 있을 때
        // 공중에서 비행 중인 경우 (스페이스바를 누르고 있어 비행 상태가 유지되는 상태)
        if (player.isFlying) {
            player.currentFlightFrames++; // 비행 프레임 증가

            // 비행 허용 프레임이 남았고 스페이스바가 계속 눌려있는 경우
            if (player.currentFlightFrames < player.maxFlightFrames && player.isHoldingSpace) {
                 // 비행 속도 유지 (중력보다 비행 힘을 강하게 적용하여 상승/유지)
                 player.velocityY = -player.flyVelocity;
            } else {
                // 비행 허용 시간 초과 또는 스페이스바 뗌 -> 비행 중지 상태로 전환
                player.isFlying = false;
                console.log('Stop flying (time out or keyup)'); // 디버깅
                // isFlying이 false가 되면 아래 if(!player.isFlying) 블록에서 중력이 적용됨
            }
        }

        // 비행 중이 아닐 때 (점프 중이거나, 비행 끝났거나, 비행 기회 없어서 비행 시작 안된 경우 등)
        if (!player.isFlying) {
             player.velocityY += player.gravity; // 중력 적용
        }
    }

    // 최종 y 위치 업데이트
    player.y += player.velocityY;

    // 바닥 아래로 내려가지 않도록 보정 (혹시 착지 판정 전에 내려간 경우)
    // groundY는 플레이어 이미지 상단 y 좌표 기준이므로, 바닥선(canvas.height-10)에 닿는 것은
    // 플레이어 이미지 하단(player.y + player.height)이 바닥선에 닿는 것과 같음.
    // 따라서 player.y가 (바닥선 y - 플레이어 높이)보다 커지면 바닥에 닿은 것으로 처리
    const floorY = canvas.height - 10; // 바닥선 Y 좌표
    const playerBottom = player.y + player.height; // 플레이어 하단 Y 좌표

    if (playerBottom > floorY) {
         player.y = floorY - player.height; // 플레이어 하단을 바닥선에 맞춤
         player.velocityY = 0; // 바닥에 닿았으면 속도 0
         player.jumpCharges = player.maxJumpCharges; // 점프 기회 모두 회복
         player.isFlying = false;
         player.currentFlightFrames = 0;
    }
     // 화면 위로 벗어나지 않도록 제한
     if (player.y < 0) {
         player.y = 0;
         player.velocityY = 0; // 상단에 닿았으면 속도 0
     }


    // --- 장애물 위치 업데이트 및 관리 ---
     const currentTime = Date.now();

     // 일정 시간마다 새 장애물 생성
     // 게임 시작 후 딜레이가 있을 수 있으므로 lastObstacleTime 초기값 고려
     if (lastObstacleTime === 0 || currentTime - lastObstacleTime > obstacleInterval) {
         createObstacle();
         lastObstacleTime = currentTime;

         // 시간이 지날수록 게임 속도와 장애물 생성 간격 조절 (난이도 상승)
         gameSpeed += 0.001; // 게임 전체 속도 미세하게 증가
         obstacleSpeed = gameSpeed; // 장애물 속도에 반영

         // 장애물 생성 간격도 줄여서 더 자주 나타나게 함
         if (obstacleInterval > 400) { // 너무 짧아지지 않게 제한
            obstacleInterval -= 0.5; // 조금씩 간격 줄이기
         }
         // console.log(`Speed: ${gameSpeed.toFixed(2)}, Interval: ${obstacleInterval}`); // 디버깅용
     }

     // 장애물 이동 및 충돌 판정, 제거
     for (let i = obstacles.length - 1; i >= 0; i--) {
         const obstacle = obstacles[i];

         // 장애물 왼쪽으로 이동
         obstacle.x -= obstacleSpeed;

         // --- 충돌 판정 (Axis-Aligned Bounding Box - AABB 방식) ---
         // 플레이어와 장애물의 사각형 영역이 겹치는지 확인
         // 각 객체의 왼쪽, 오른쪽, 위쪽, 아래쪽 경계를 비교
         const playerRight = player.x + player.width;
         const playerBottom = player.y + player.height;
         const obstacleRight = obstacle.x + obstacle.width;
         const obstacleBottom = obstacle.y + obstacle.height;

         if (playerRight > obstacle.x && // 플레이어 오른쪽이 장애물 왼쪽보다 클 때
             player.x < obstacleRight && // 플레이어 왼쪽이 장애물 오른쪽보다 작을 때
             playerBottom > obstacle.y && // 플레이어 아래쪽이 장애물 위쪽보다 클 때
             player.y < obstacleBottom) { // 플레이어 위쪽이 장애물 아래쪽보다 작을 때
             // 충돌 발생! 게임 오버 처리
             isGameOver = true;
             console.log('게임 오버! 충돌 발생.');
             showGameOver(); // 게임 오버 화면 표시 함수 호출
             // 충돌 발생 후에는 더 이상 이 프레임에서 업데이트를 진행하지 않고 종료
             return;
         }

         // 장애물이 화면 왼쪽 밖으로 완전히 나갔을 때
         if (obstacle.x + obstacle.width < 0) {
             // 장애물 제거
             obstacles.splice(i, 1);
             // 이 장애물을 성공적으로 피했다면 점수 증가
             // (이미 충돌해서 게임 오버되지 않은 경우에만 점수 증가)
             if (!isGameOver && !obstacle.passed) {
                  score++; // 점수 1점 증가
                  scoreBoard.textContent = `점수: ${score}`; // 점수판 업데이트
                  obstacle.passed = true; // 이 장애물은 점수 계산 완료 (중복 점수 방지)
             }
         }
     }
}


// --- 게임 오버 화면 표시 함수 ---
function showGameOver() {
    // 게임 오버 상태일 때만 실행
    if (!isGameOver) return; // 혹시 잘못 호출된 경우 방지

    // 게임 오버 화면은 게임 루프와 별개로 Canvas 위에 그림
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // 반투명 검정색 오버레이 (투명도 0.7)
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = '40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('게임 오버!', canvas.width / 2, canvas.height / 2 - 30);

    ctx.font = '30px sans-serif';
    ctx.fillText(`최종 점수: ${score}`, canvas.width / 2, canvas.height / 2 + 20);

    // 다시 시작 버튼 표시
    if (restartButton) { // 버튼 요소가 존재하는지 다시 확인
         restartButton.classList.remove('hidden');
    } else {
         // 버튼이 없으면 텍스트로 안내 (혹시 HTML 오류 시 대비)
         ctx.font = '20px sans-serif';
         ctx.fillText('페이지를 새로고침하여 다시 시작하세요.', canvas.width / 2, canvas.height / 2 + 60);
    }

    isRestartable = true; // 재시작 가능 상태로 설정
     console.log('게임 오버 화면 표시. 재시작 가능 상태.');
}

// --- 게임 재시작 함수 ---
function restartGame() {
    console.log('게임 재시작 시작!');

    // 모든 게임 상태 초기화
    score = 0;
    scoreBoard.textContent = `점수: ${score}`; // 점수판 초기화

    player.x = 50; // 플레이어 위치 초기화
    player.y = canvas.height - 10 - player.height; // 바닥선 바로 위로
    player.velocityY = 0;
    player.jumpCharges = player.maxJumpCharges;
    player.isFlying = false;
    player.currentFlightFrames = 0;
    player.isHoldingSpace = false; // 재시작 시 스페이스바 누름 상태 초기화

    obstacles = []; // 장애물 목록 초기화

    gameSpeed = 5; // 게임 속도 초기화
    obstacleSpeed = gameSpeed;
    obstacleInterval = 1200; // 장애물 생성 간격 초기화
    lastObstacleTime = 0; // 마지막 장애물 생성 시간 초기화

    isGameOver = false; // 게임 오버 상태 해제
    isRestartable = false; // 재시작 가능 상태 해제

    // 다시 시작 버튼 숨김
    if (restartButton) { // 버튼 요소가 존재하는지 다시 확인
         restartButton.classList.add('hidden');
    }

    console.log('게임 상태 초기화 완료. 게임 루프 재개 준비.');
    // isGameOver가 false가 되었으므로, 다음 requestAnimationFrame 호출 시 gameLoop가 정상 실행됨.
    // 별도로 gameLoop()를 다시 호출할 필요는 없습니다.
    // 하지만 만약 gameLoop가 완전히 멈춰버린 경우를 대비하여 여기서 다시 호출해줄 수도 있습니다.
    // 안전하게 하려면 이 라인을 추가:
    requestAnimationFrame(gameLoop); // 재시작 후 첫 프레임 요청
}


// --- 메인 게임 루프 ---
function gameLoop() {
    // Canvas와 Context가 준비되었는지 다시 한번 확인
    if (!canvas || !ctx) {
        console.error('Canvas 또는 Context가 준비되지 않았습니다. 게임 루프 중단.');
        return; // 준비되지 않았으면 루프 중단
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height); // 화면 지우기
    drawBackground(); // 배경 그리기

    if (!isGameOver) {
        updateGame(); // 게임 로직 업데이트
        obstacles.forEach(drawObstacle); // 장애물 그리기
        drawPlayer(); // 플레이어 그리기
    } else {
        showGameOver(); // 게임 오버 상태이면 게임 오버 화면 표시 (버튼 포함)
    }

    // 게임 오버 상태가 아니면 다음 프레임 요청 (약 60fps)
    if (!isGameOver) {
        requestAnimationFrame(gameLoop);
    }
    // 게임 오버 상태가 되면 requestAnimationFrame이 더 이상 호출되지 않아 루프가 멈춤.
    // 재시작 버튼 클릭 시 restartGame()이 isGameOver를 false로 만들고,
    // restartGame()에서 requestAnimationFrame(gameLoop)를 호출하여 루프 재개.
}

// --- 게임 시작 ---
// 이미지 로딩을 시작합니다.
console.log('이미지 로딩 시작...');

// 이미지가 이미 캐시되어 로드 완료된 경우를 대비하여 초기 체크
// playerImage.complete 속성은 이미지가 로딩되었는지 true/false 반환
if (playerImage.complete) imagesLoadedCount++;
if (obstacleImage.complete) imagesLoadedCount++;

// 모든 이미지가 이미 로드 완료 상태라면 바로 게임 시작
if (imagesLoadedCount === imagesToLoad) {
    console.log('이미지 모두 로드 완료 (캐시 또는 매우 빠름). 바로 게임 시작.');
     if (!isGameOver) {
         gameLoop();
     }
} else {
     console.log(`이미지 로드 중... (${imagesLoadedCount}/${imagesToLoad})`);
    // 이미지가 아직 로드 중이면, onload/onerror 이벤트 리스너의
    // imageLoadComplete() 함수가 마지막 이미지 로드 시 gameLoop를 호출할 것임.
}

// 초기 상태에서는 다시 시작 버튼 숨기기
if (restartButton) { // 버튼 요소가 있는지 확인 후 클래스 추가
    restartButton.classList.add('hidden');
} else {
    console.warn('다시 시작 버튼 요소를 찾을 수 없습니다. 버튼 숨김 처리를 건너뜁니다.');
}
