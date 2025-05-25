const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');

// 캔버스 크기 설정
canvas.width = 600;
canvas.height = 400;

// 게임 기본 설정
let score = 0; // 현재 점수
let isGameOver = false; // 게임 오버 상태인지 아닌지 (무적이라 거의 false 상태!)
const gameSpeed = 5; // 게임 진행 속도 (적 이동 속도 등에 영향)

// 플레이어 설정 (이제 무적!)
const player = {
    x: canvas.width / 2 - 25, // 화면 가로 중앙
    y: canvas.height - 60, // 화면 하단에서 살짝 위 (바닥 라인)
    width: 50,
    height: 50,
    color: 'lightblue', // 플레이어 색상
    speed: 7 // 플레이어 좌우 이동 속도
};

// 총알 설정
const bullets = []; // 발사된 총알들을 담을 배열
const bulletWidth = 5;
const bulletHeight = 15;
const bulletColor = 'yellow'; // 총알 색상
const bulletSpeed = 7; // 총알 속도

// 적 설정
const enemies = []; // 나타날 적들을 담을 배열
const enemyWidth = 40;
const enemyHeight = 40;
const enemyColor = 'red'; // 적 색상
const enemySpeed = 2; // 적 하강 속도
const enemyInterval = 1000; // 새로운 적 생성 주기 (밀리초)
let lastEnemyTime = 0; // 마지막 적 생성 시간

// 키보드 입력 상태
const keys = {};
document.addEventListener('keydown', function(e) {
    keys[e.code] = true; // 키가 눌리면 true
    // 스페이스바 누르면 총알 발사! (게임 오버 상태 아니면)
    if (e.code === 'Space' && !isGameOver) {
        shoot();
    }
});
document.addEventListener('keyup', function(e) {
    keys[e.code] = false; // 키에서 손 떼면 false
});


// 플레이어 좌우 이동 함수
function movePlayer() {
    // 왼쪽 화살표 키 또는 'A' 키가 눌렸으면 왼쪽으로 이동
    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.x -= player.speed;
    }
    // 오른쪽 화살표 키 또는 'D' 키가 눌렸으면 오른쪽으로 이동
    if (keys['ArrowRight'] || keys['KeyD']) {
        player.x += player.speed;
    }

    // 플레이어가 화면 밖으로 나가지 않게 경계 처리
    if (player.x < 0) {
        player.x = 0;
    }
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }
}

// 총알 발사 함수
function shoot() {
    // 플레이어 위치에서 총알 생성!
    const bullet = {
        x: player.x + player.width / 2 - bulletWidth / 2, // 플레이어 중앙에서 발사!
        y: player.y, // 플레이어 머리 위에서 시작!
        width: bulletWidth,
        height: bulletHeight,
        color: bulletColor,
        speed: bulletSpeed
    };
    bullets.push(bullet); // 발사된 총알을 bullets 배열에 추가해요!
}


// 게임 루프 (화면을 계속 업데이트 해주는 함수)
function gameLoop(currentTime) {
    // 게임 오버 상태면 멈춰! (무적이라 여기 올 일은 거의 없을 거예요!)
    if (isGameOver) {
        // 게임 오버 메시지 표시
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white'; // 글자색 흰색
        ctx.font = '40px Arial'; // 글자 크기
        ctx.textAlign = 'center'; // 가운데 정렬
        ctx.fillText('게임 오버!', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '25px Arial';
        ctx.fillText('점수: ' + score, canvas.width / 2, canvas.height / 2 + 20);
        return; // 게임 루프 중지
    }

    const deltaTime = currentTime - lastEnemyTime; // 마지막 적 생성 후 시간 계산

    // 화면 전체 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- 플레이어 움직임 및 그리기 ---
    movePlayer(); // 키보드 입력에 따라 플레이어 위치 업데이트!
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // --- 적 생성 ---
    // 일정 시간마다 새로운 적 등장!
    if (deltaTime > enemyInterval) {
        // 화면 상단 랜덤 위치에 적 생성!
        const enemy = {
            x: Math.random() * (canvas.width - enemyWidth), // 화면 가로 범위 내 랜덤 위치!
            y: 0, // 화면 맨 위에서 시작!
            width: enemyWidth, // 적 너비
            height: enemyHeight, // 적 높이
            color: enemyColor, // 적 색깔
            speed: enemySpeed // 적이 내려오는 속도
        };
        enemies.push(enemy); // 적 배열에 추가!
        lastEnemyTime = currentTime; // 마지막 적 등장 시간 업데이트!
    }

    // --- 적 업데이트 및 그리기 ---
    // 적들을 하나씩 움직이고 그려요
    for (let i = 0; i < enemies.length; i++) {
        // 현재 적이 유효한지 확인 (총알에 맞아 사라졌을 수도 있으니)
        if (!enemies[i]) continue;

        enemies[i].y += enemies[i].speed; // 적 하강!

        // 적 그리기!
        ctx.fillStyle = enemies[i].color;
        ctx.fillRect(enemies[i].x, enemies[i].y, enemies[i].width, enemies[i].height);

        // --- 플레이어와 적 충돌 판정! (무적 코드 적용됨!) ---
        // * 여기에서 플레이어가 적과 부딪혀도 게임 오버되지 않도록 isGameOver = true 코드를 제거했습니다! *
        /*
        if (
            player.x < enemies[i].x + enemies[i].width &&
            player.x + player.width > enemies[i].x &&
            player.y < enemies[i].y + enemies[i].height &&
            player.y + player.height > enemies[i].y
        ) {
            // 꺄악! 플레이어가 적에게 부딪혔어요! (하지만 무적!)
            // isGameOver = true; // 이 코드를 제거하여 무적 상태로 만듭니다.
        }
        */
        // 플레이어는 무적이기 때문에 충돌 시 별도 처리가 없습니다.


        // 화면 아래쪽으로 완전히 나간 적은 이제 안녕~
        if (enemies[i].y > canvas.height) {
             enemies.splice(i, 1); // 배열에서 제거!
             i--; // 제거했으니까 인덱스를 하나 줄여줘요
             // 화면 아래로 나간 적은 점수에 영향 주지 않아요.
        }
    }

    // --- 총알 업데이트 및 그리기 ---
    // 총알들을 하나씩 움직이고 그려요
    for (let i = 0; i < bullets.length; i++) {
        // 현재 총알이 유효한지 확인 (적에게 맞아 사라졌을 수도 있으니)
        if (!bullets[i]) continue;

        bullets[i].y -= bullets[i].speed; // 총알 상승!

        // 총알 그리기!
        ctx.fillStyle = bullets[i].color;
        ctx.fillRect(bullets[i].x, bullets[i].y, bullets[i].width, bullets[i].height);

        // --- 총알과 적 충돌 판정! 펑! (점수 치트키 + 멈춤 오류 수정!) ---
        // 지금 보고 있는 총알이 어떤 적에게 맞았는지 확인!
        // 충돌된 적이 있으면 그 적과 총알을 제거하고 점수를 올립니다.
        let bulletHit = false; // 현재 총알이 적을 맞췄는지 확인하는 플래그

        for (let j = 0; j < enemies.length; j++) {
            // 총알과 적이 모두 존재하고 부딪혔는지 확인
            if (
                bullets[i] && // 현재 총알이 아직 있는지 확인
                enemies[j] && // 현재 적이 아직 있는지 확인
                bullets[i].x < enemies[j].x + enemies[j].width &&
                bullets[i].x + bullets[i].width > enemies[j].x &&
                bullets[i].y < enemies[j].y + enemies[j].height &&
                bullets[i].y + bullets[i].height > enemies[j].y
            ) {
                // 얏호! 총알이 적에게 명중! 점수 치트키 발동! 💰
                score += 9999999999999999999999999999999999999; // <<-- 점수를 왕창 올립니다!
                scoreDisplay.textContent = '점수: ' + score; // 화면에 점수 업데이트!

                // 맞은 적은 사라져야죠!
                enemies.splice(j, 1); // 적 배열에서 제거!
                j--; // 적 배열에서 제거했으니 인덱스 조정! (중요!)

                bulletHit = true; // 이 총알이 적을 맞췄다고 표시
                // * 여기서는 break를 사용하지 않습니다!
                //   하나의 총알이 동시에 여러 적을 맞추는 경우는 드물지만,
                //   혹시라도 그런 상황이 발생하거나, break로 인해 게임 루프 흐름이 꼬이는 것을 방지합니다.
            }
        }

        // --- 적에게 맞은 총알 제거 ---
        // 위의 반복문에서 적을 맞췄다면 이 총알도 제거합니다.
        if(bulletHit) {
             bullets.splice(i, 1); // 총알 배열에서 제거!
             i--; // 총알 배열에서 제거했으니 인덱스 조정! (중요!)
        }


        // --- 화면 위쪽으로 완전히 나간 총알 제거 ---
        // (위의 총알-적 충돌 및 제거 로직 후 총알이 아직 남아있는지 다시 확인)
        if (bullets[i] && bullets[i].y + bullets[i].height < 0) {
             bullets.splice(i, 1); // 총알 배열에서 제거!
             i--; // 총알 배열에서 제거했으니 인덱스 조정! (중요!)
        }
    }

    // 다음 그림을 준비해! (부드러운 애니메이션을 위해!)
    requestAnimationFrame(gameLoop);
}


// 게임 시작이다!!! 🚀🚀🚀
gameLoop(0); // 처음 시작 시간은 0으로!
s
