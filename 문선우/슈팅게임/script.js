// Canvas 요소와 2D 렌더링 컨텍스트 가져오기
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const messageDisplay = document.getElementById('message');

// 게임 변수 정의
let player = {
    x: canvas.width / 2 - 20, // 플레이어 초기 x 좌표 (중앙 정렬)
    y: canvas.height - 60, // 플레이어 초기 y 좌표 (바닥에서 60px 위, y축 고정)
    width: 40, // 플레이어 너비
    height: 40, // 플레이어 높이
    speed: 5 // 플레이어 이동 속도
};

let bullets = []; // 현재 화면에 있는 발사체 목록
const bulletWidth = 5; // 발사체 너비
const bulletHeight = 10; // 발사체 높이
const bulletSpeed = 7; // 발사체 속도
let canShoot = true; // 발사 딜레이 제어를 위한 플래그 (현재 발사 가능한지 여부)
const shootDelay = 200; // 발사 딜레이 (밀리초) - 0.2초에 한 발

let enemies = []; // 현재 화면에 있는 적 목록
const enemySize = 30; // 적의 크기 (정사각형으로 가정)
let enemySpeed = 2; // 적의 하강 속도
const enemyInterval = 1000; // 새로운 적 생성 간격 (밀리초)
let lastEnemyTime = 0; // 마지막 적이 생성된 시간

let score = 0; // 게임 점수
let isGameOver = false; // 게임 오버 상태 여부

// 키보드 입력 상태 저장 객체
let keys = {
    left: false,
    right: false,
    space: false // 발사 키
};

// 키보드 이벤트 리스너: 키 눌렀을 때 해당 키의 상태를 true로 변경
document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'Space') keys.space = true;
});

// 키보드 이벤트 리스너: 키 뗐을 때 해당 키의 상태를 false로 변경
document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'Space') {
        keys.space = false;
        // 스페이스바를 뗐을 때 다음 발사를 바로 가능하게 할 수도 있습니다. (선택 사항)
        // canShoot = true;
    }
});

// 플레이어 발사 함수
function shoot() {
    // canShoot 플래그가 true일 때만 발사 실행
    if (!canShoot) return;

    // 새로운 발사체를 플레이어 위치에서 생성하여 bullets 배열에 추가
    const newBullet = {
        x: player.x + player.width / 2 - bulletWidth / 2, // 플레이어 중앙 상단에서 발사 위치 계산
        y: player.y, // 플레이어 y 좌표에서 시작
        width: bulletWidth,
        height: bulletHeight,
        speed: bulletSpeed // 발사체 속도
    };
    bullets.push(newBullet);

    // 발사 후 canShoot 플래그를 false로 설정하여 연속 발사 방지
    canShoot = false;

    // 설정된 딜레이 시간(shootDelay) 후에 canShoot 플래그를 다시 true로 변경
    setTimeout(() => {
        canShoot = true;
    }, shootDelay);
}

// 게임 상태를 업데이트하는 메인 함수 (매 프레임 실행)
function update(currentTime) {
    // 게임 오버 상태이면 업데이트 중단
    if (isGameOver) return;

    // 플레이어 위치 업데이트 (키 입력 상태에 따라 좌우 이동)
    // 왼쪽 화살표가 눌려있고 캔버스 왼쪽 경계를 넘지 않았다면 왼쪽으로 이동
    if (keys.left && player.x > 0) {
        player.x -= player.speed;
    }
    // 오른쪽 화살표가 눌려있고 캔버스 오른쪽 경계를 넘지 않았다면 오른쪽으로 이동
    if (keys.right && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }

    // 발사 처리 (스페이스바가 눌려있을 때 shoot 함수 호출)
    if (keys.space) {
        shoot(); // shoot 함수 내부에서 발사 딜레이를 제어함
    }


    // 발사체 위치 업데이트 및 화면 밖 발사체 제거
    for (let i = 0; i < bullets.length; i++) {
        const bullet = bullets[i];
        bullet.y -= bullet.speed; // 발사체를 위쪽(y 좌표 감소)으로 이동

        // 발사체가 화면 상단 밖으로 나가면 배열에서 제거
        if (bullet.y + bullet.height < 0) {
            bullets.splice(i, 1);
            i--; // 배열에서 요소를 제거했으므로 인덱스를 1 감소시켜 다음 요소가 건너뛰어지지 않게 함
        }
    }

    // 새로운 적 생성 로직
    // 현재 시간과 마지막 적 생성 시간의 차이가 설정된 간격보다 크면 새로운 적 생성
    if (currentTime - lastEnemyTime > enemyInterval) {
        // 화면 상단에서 무작위 x 좌표에 새로운 적 객체 생성
        const newEnemy = {
            x: Math.random() * (canvas.width - enemySize), // Canvas 너비 내에서 무작위 x 좌표
            y: 0, // Canvas 상단에서 시작
            width: enemySize,
            height: enemySize,
            speed: enemySpeed // 적 하강 속도
        };
        enemies.push(newEnemy); // 적 목록 배열에 추가
        lastEnemyTime = currentTime; // 마지막 적 생성 시간 업데이트
    }

    // 적 위치 업데이트 및 화면 밖 적 제거
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        enemy.y += enemy.speed; // 적을 아래쪽(y 좌표 증가)으로 이동

        // 적이 화면 하단 밖으로 나가면 배열에서 제거
        if (enemy.y > canvas.height) {
            enemies.splice(i, 1);
            i--; // 배열에서 요소를 제거했으므로 인덱스 조정
        }
    }

    // 충돌 판정: 발사체와 적
    // 현재 발사체 목록의 모든 발사체와 현재 적 목록의 모든 적을 비교
    for (let i = 0; i < bullets.length; i++) {
        const bullet = bullets[i];
        for (let j = 0; j < enemies.length; j++) {
            const enemy = enemies[j];

            // 발사체와 적의 경계 상자가 겹치는지 확인 (간단한 AABB 충돌 감지)
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                // 충돌 발생 시
                bullets.splice(i, 1); // 충돌한 발사체 제거
                enemies.splice(j, 1); // 충돌한 적 제거
                score += 10; // 점수 증가 (예: 적 하나당 10점)
                scoreDisplay.textContent = score; // 화면에 점수 업데이트

                i--; // 발사체 배열에서 요소를 제거했으므로 인덱스 조정
                j--; // 적 배열에서 요소를 제거했으므로 인덱스 조정
                break; // 현재 발사체는 충돌했으니 더 이상 다른 적과 비교할 필요 없음
            }
        }
    }

     // 충돌 판정: 플레이어와 적
     // 플레이어와 적 목록의 모든 적을 비교
     for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
         // 플레이어와 적의 경계 상자가 겹치는지 확인
         if (
             player.x < enemy.x + enemy.width &&
             player.x + player.width > enemy.x &&
             player.y < enemy.y + enemy.height &&
             player.y + player.height > enemy.y
         ) {
             gameOver(); // 충돌 발생 시 게임 오버 함수 호출
             return; // 게임 루프 중단
         뮬
         }
     }


    // 화면 다시 그리기 함수 호출
    draw();

    // 다음 프레임을 위해 requestAnimationFrame 함수 호출하여 update 함수 반복 실행 요청
    requestAnimationFrame(update);
}

// Canvas에 게임 요소들을 그리는 함수
function draw() {
    // Canvas 전체를 검정색(#333)으로 지워서 배경처럼 사용
    ctx.fillStyle = '#333'; // 배경색 설정
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Canvas 전체를 배경색으로 채움

    // 플레이어 그리기 (흰색 사각형)
    ctx.fillStyle = 'white'; // 플레이어 색상 설정
    ctx.fillRect(player.x, player.y, player.width, player.height); // 플레이어 위치와 크기에 맞게 사각형 그림

    // 발사체 그리기 (노란색 사각형)
    ctx.fillStyle = 'yellow'; // 발사체 색상 설정
    for (const bullet of bullets) {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height); // 각 발사체를 사각형으로 그림
    }

    // 적 그리기 (빨간색 사각형)
    ctx.fillStyle = 'red'; // 적 색상 설정
    for (const enemy of enemies) {
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height); // 각 적을 사각형으로 그림
    }

    // 점수는 HTML 요소에 표시하므로 여기서 그릴 필요 없음
}

// 게임 오버 처리 함수
function gameOver() {
    isGameOver = true; // 게임 오버 상태로 변경

    // 화면 중앙에 게임 오버 메시지 표시
    messageDisplay.textContent = 'GAME OVER'; // 메시지 내용 설정
    messageDisplay.style.color = 'red'; // 메시지 색상 설정
    messageDisplay.style.fontSize = '2em'; // 메시지 글자 크기 설정

    // 최종 점수는 이미 HTML 요소에 업데이트되어 있음
    console.log("Game Over! Final Score:", score); // 콘솔에도 최종 점수 출력
}

// 게임 시작 함수
function startGame() {
    // 게임 관련 변수 초기화 (재시작 시 필요)
    lastEnemyTime = performance.now(); // 게임 시작 시간으로 마지막 적 생성 시간 초기화
    score = 0; // 점수 초기화
    scoreDisplay.textContent = score; // 화면 점수 초기화
    messageDisplay.textContent = ''; // 게임 메시지 초기화
    isGameOver = false; // 게임 오버 상태 초기화
    enemies = []; // 적 목록 초기화
    bullets = []; // 발사체 목록 초기화
    canShoot = true; // 발사 가능 상태 초기화

    requestAnimationFrame(update); // 게임 루프 시작 (첫 번째 update 함수 호출)
}

// 웹 페이지 로드가 완료되면 startGame 함수 호출
window.onload = startGame;
